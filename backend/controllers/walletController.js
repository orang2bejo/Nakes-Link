const { Wallet, WalletTransaction, User, Payment } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sendNotification } = require('../services/notificationService');
const { processWithdrawal } = require('../services/withdrawalService');

// Get wallet details
exports.getWallet = async (req, res) => {
  try {
    const user_id = req.user.id;

    let wallet = await Wallet.findOne({
      where: { user_id },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'full_name', 'email']
        }
      ]
    });

    // Create wallet if doesn't exist
    if (!wallet) {
      wallet = await Wallet.create({
        user_id,
        current_balance: 0,
        pending_balance: 0,
        frozen_balance: 0,
        currency: 'IDR',
        status: 'active'
      });

      // Reload with user details
      wallet = await Wallet.findByPk(wallet.id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'full_name', 'email']
          }
        ]
      });
    }

    res.json({
      success: true,
      data: { wallet }
    });

  } catch (error) {
    console.error('Get wallet error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get wallet transactions
exports.getWalletTransactions = async (req, res) => {
  try {
    const {
      type,
      status,
      start_date,
      end_date,
      page = 1,
      limit = 20
    } = req.query;

    const user_id = req.user.id;
    const offset = (page - 1) * limit;

    // Get user's wallet
    const wallet = await Wallet.findOne({ where: { user_id } });
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found'
      });
    }

    const whereClause = { wallet_id: wallet.id };

    if (type) {
      whereClause.type = type;
    }

    if (status) {
      whereClause.status = status;
    }

    if (start_date && end_date) {
      whereClause.created_at = {
        [Op.between]: [new Date(start_date), new Date(end_date)]
      };
    }

    const transactions = await WalletTransaction.findAndCountAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        transactions: transactions.rows,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(transactions.count / limit),
          total_items: transactions.count,
          items_per_page: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get wallet transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Top up wallet
exports.topUpWallet = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { amount, payment_method = 'bank_transfer' } = req.body;
    const user_id = req.user.id;

    // Get or create wallet
    let wallet = await Wallet.findOne({ where: { user_id } });
    if (!wallet) {
      wallet = await Wallet.create({
        user_id,
        current_balance: 0,
        pending_balance: 0,
        frozen_balance: 0,
        currency: 'IDR',
        status: 'active'
      });
    }

    // Validate amount
    const topUpAmount = parseFloat(amount);
    if (topUpAmount < 10000) { // Minimum 10,000 IDR
      return res.status(400).json({
        success: false,
        message: 'Minimum top-up amount is 10,000 IDR'
      });
    }

    if (topUpAmount > 10000000) { // Maximum 10,000,000 IDR
      return res.status(400).json({
        success: false,
        message: 'Maximum top-up amount is 10,000,000 IDR'
      });
    }

    // Create wallet transaction
    const transaction = await WalletTransaction.create({
      wallet_id: wallet.id,
      user_id,
      type: 'top_up',
      amount: topUpAmount,
      description: `Wallet top-up via ${payment_method}`,
      payment_method,
      status: 'pending'
    });

    // Here you would integrate with payment gateway
    // For now, we'll simulate immediate success for bank transfer
    if (payment_method === 'bank_transfer') {
      // In production, this would be handled by payment callback
      await transaction.markAsCompleted();
      await wallet.addBalance(topUpAmount);

      await sendNotification({
        user_id,
        type: 'wallet_topup_success',
        title: 'Top-up Successful',
        message: `Your wallet has been topped up with ${topUpAmount.toLocaleString('id-ID')} IDR`,
        data: {
          transaction_id: transaction.id,
          amount: topUpAmount
        }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Top-up initiated successfully',
      data: {
        transaction_id: transaction.id,
        amount: topUpAmount,
        status: transaction.status,
        payment_method
      }
    });

  } catch (error) {
    console.error('Top up wallet error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Withdraw from wallet
exports.withdrawFromWallet = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const {
      amount,
      bank_account,
      account_holder_name,
      pin
    } = req.body;

    const user_id = req.user.id;

    // Get wallet
    const wallet = await Wallet.findOne({ where: { user_id } });
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found'
      });
    }

    // Validate PIN
    if (!wallet.pin_hash) {
      return res.status(400).json({
        success: false,
        message: 'Please set up your wallet PIN first'
      });
    }

    const isPinValid = await bcrypt.compare(pin, wallet.pin_hash);
    if (!isPinValid) {
      await wallet.incrementPinAttempts();
      return res.status(400).json({
        success: false,
        message: 'Invalid PIN'
      });
    }

    // Reset PIN attempts on successful validation
    await wallet.resetPinAttempts();

    // Validate withdrawal
    const withdrawAmount = parseFloat(amount);
    const validationResult = wallet.validateWithdrawal(withdrawAmount);
    
    if (!validationResult.valid) {
      return res.status(400).json({
        success: false,
        message: validationResult.message
      });
    }

    // Check daily/monthly limits
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [dailyWithdrawals, monthlyWithdrawals] = await Promise.all([
      WalletTransaction.sum('amount', {
        where: {
          wallet_id: wallet.id,
          type: 'withdrawal',
          status: { [Op.in]: ['completed', 'pending'] },
          created_at: { [Op.gte]: startOfDay }
        }
      }),
      WalletTransaction.sum('amount', {
        where: {
          wallet_id: wallet.id,
          type: 'withdrawal',
          status: { [Op.in]: ['completed', 'pending'] },
          created_at: { [Op.gte]: startOfMonth }
        }
      })
    ]);

    const dailyTotal = (dailyWithdrawals || 0) + withdrawAmount;
    const monthlyTotal = (monthlyWithdrawals || 0) + withdrawAmount;

    if (dailyTotal > wallet.daily_limit) {
      return res.status(400).json({
        success: false,
        message: `Daily withdrawal limit exceeded. Limit: ${wallet.daily_limit.toLocaleString('id-ID')} IDR`
      });
    }

    if (monthlyTotal > wallet.monthly_limit) {
      return res.status(400).json({
        success: false,
        message: `Monthly withdrawal limit exceeded. Limit: ${wallet.monthly_limit.toLocaleString('id-ID')} IDR`
      });
    }

    // Create withdrawal transaction
    const transaction = await WalletTransaction.create({
      wallet_id: wallet.id,
      user_id,
      type: 'withdrawal',
      amount: withdrawAmount,
      description: `Withdrawal to ${bank_account}`,
      destination_account: bank_account,
      account_holder_name,
      status: 'pending'
    });

    // Freeze the amount
    await wallet.freezeBalance(withdrawAmount);

    // Process withdrawal (this would typically be async)
    try {
      const withdrawalResult = await processWithdrawal({
        transaction_id: transaction.id,
        amount: withdrawAmount,
        bank_account,
        account_holder_name,
        user_id
      });

      if (withdrawalResult.success) {
        await transaction.markAsCompleted();
        await wallet.deductBalance(withdrawAmount);
        await wallet.unfreezeBalance(withdrawAmount);

        await sendNotification({
          user_id,
          type: 'withdrawal_success',
          title: 'Withdrawal Successful',
          message: `Your withdrawal of ${withdrawAmount.toLocaleString('id-ID')} IDR has been processed`,
          data: {
            transaction_id: transaction.id,
            amount: withdrawAmount
          }
        });
      } else {
        await transaction.markAsFailed(withdrawalResult.error);
        await wallet.unfreezeBalance(withdrawAmount);

        await sendNotification({
          user_id,
          type: 'withdrawal_failed',
          title: 'Withdrawal Failed',
          message: `Your withdrawal request failed: ${withdrawalResult.error}`,
          data: {
            transaction_id: transaction.id,
            amount: withdrawAmount
          }
        });
      }
    } catch (withdrawalError) {
      console.error('Withdrawal processing error:', withdrawalError);
      await transaction.markAsFailed('Processing error');
      await wallet.unfreezeBalance(withdrawAmount);
    }

    res.status(201).json({
      success: true,
      message: 'Withdrawal request submitted successfully',
      data: {
        transaction_id: transaction.id,
        amount: withdrawAmount,
        status: 'pending'
      }
    });

  } catch (error) {
    console.error('Withdraw from wallet error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Transfer between wallets
exports.transferFunds = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const {
      recipient_email,
      amount,
      description,
      pin
    } = req.body;

    const sender_id = req.user.id;

    // Get sender wallet
    const senderWallet = await Wallet.findOne({ where: { user_id: sender_id } });
    if (!senderWallet) {
      return res.status(404).json({
        success: false,
        message: 'Sender wallet not found'
      });
    }

    // Validate PIN
    if (!senderWallet.pin_hash) {
      return res.status(400).json({
        success: false,
        message: 'Please set up your wallet PIN first'
      });
    }

    const isPinValid = await bcrypt.compare(pin, senderWallet.pin_hash);
    if (!isPinValid) {
      await senderWallet.incrementPinAttempts();
      return res.status(400).json({
        success: false,
        message: 'Invalid PIN'
      });
    }

    await senderWallet.resetPinAttempts();

    // Find recipient
    const recipient = await User.findOne({ where: { email: recipient_email } });
    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: 'Recipient not found'
      });
    }

    if (recipient.id === sender_id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot transfer to yourself'
      });
    }

    // Get or create recipient wallet
    let recipientWallet = await Wallet.findOne({ where: { user_id: recipient.id } });
    if (!recipientWallet) {
      recipientWallet = await Wallet.create({
        user_id: recipient.id,
        current_balance: 0,
        pending_balance: 0,
        frozen_balance: 0,
        currency: 'IDR',
        status: 'active'
      });
    }

    // Validate transfer
    const transferAmount = parseFloat(amount);
    const validationResult = senderWallet.validateSpending(transferAmount);
    
    if (!validationResult.valid) {
      return res.status(400).json({
        success: false,
        message: validationResult.message
      });
    }

    // Create transactions
    const [senderTransaction, recipientTransaction] = await Promise.all([
      WalletTransaction.create({
        wallet_id: senderWallet.id,
        user_id: sender_id,
        type: 'transfer_out',
        amount: transferAmount,
        description: description || `Transfer to ${recipient.full_name}`,
        destination_user_id: recipient.id,
        status: 'completed'
      }),
      WalletTransaction.create({
        wallet_id: recipientWallet.id,
        user_id: recipient.id,
        type: 'transfer_in',
        amount: transferAmount,
        description: description || `Transfer from ${req.user.full_name}`,
        source_user_id: sender_id,
        status: 'completed'
      })
    ]);

    // Process transfer
    await senderWallet.transferFunds(recipientWallet, transferAmount);

    // Send notifications
    await Promise.all([
      sendNotification({
        user_id: sender_id,
        type: 'transfer_sent',
        title: 'Transfer Sent',
        message: `You sent ${transferAmount.toLocaleString('id-ID')} IDR to ${recipient.full_name}`,
        data: {
          transaction_id: senderTransaction.id,
          amount: transferAmount,
          recipient: recipient.full_name
        }
      }),
      sendNotification({
        user_id: recipient.id,
        type: 'transfer_received',
        title: 'Transfer Received',
        message: `You received ${transferAmount.toLocaleString('id-ID')} IDR from ${req.user.full_name}`,
        data: {
          transaction_id: recipientTransaction.id,
          amount: transferAmount,
          sender: req.user.full_name
        }
      })
    ]);

    res.status(201).json({
      success: true,
      message: 'Transfer completed successfully',
      data: {
        transaction_id: senderTransaction.id,
        amount: transferAmount,
        recipient: {
          name: recipient.full_name,
          email: recipient.email
        }
      }
    });

  } catch (error) {
    console.error('Transfer funds error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Set wallet PIN
exports.setWalletPin = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { pin, confirm_pin } = req.body;
    const user_id = req.user.id;

    if (pin !== confirm_pin) {
      return res.status(400).json({
        success: false,
        message: 'PIN confirmation does not match'
      });
    }

    // Get or create wallet
    let wallet = await Wallet.findOne({ where: { user_id } });
    if (!wallet) {
      wallet = await Wallet.create({
        user_id,
        current_balance: 0,
        pending_balance: 0,
        frozen_balance: 0,
        currency: 'IDR',
        status: 'active'
      });
    }

    // Hash PIN
    const saltRounds = 12;
    const hashedPin = await bcrypt.hash(pin, saltRounds);

    // Update wallet
    await wallet.update({
      pin_hash: hashedPin,
      pin_attempts: 0,
      pin_locked_until: null
    });

    res.json({
      success: true,
      message: 'Wallet PIN set successfully'
    });

  } catch (error) {
    console.error('Set wallet PIN error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Change wallet PIN
exports.changeWalletPin = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { current_pin, new_pin, confirm_new_pin } = req.body;
    const user_id = req.user.id;

    if (new_pin !== confirm_new_pin) {
      return res.status(400).json({
        success: false,
        message: 'New PIN confirmation does not match'
      });
    }

    // Get wallet
    const wallet = await Wallet.findOne({ where: { user_id } });
    if (!wallet || !wallet.pin_hash) {
      return res.status(404).json({
        success: false,
        message: 'Wallet PIN not set'
      });
    }

    // Validate current PIN
    const isCurrentPinValid = await bcrypt.compare(current_pin, wallet.pin_hash);
    if (!isCurrentPinValid) {
      await wallet.incrementPinAttempts();
      return res.status(400).json({
        success: false,
        message: 'Current PIN is incorrect'
      });
    }

    // Hash new PIN
    const saltRounds = 12;
    const hashedNewPin = await bcrypt.hash(new_pin, saltRounds);

    // Update wallet
    await wallet.update({
      pin_hash: hashedNewPin,
      pin_attempts: 0,
      pin_locked_until: null
    });

    res.json({
      success: true,
      message: 'Wallet PIN changed successfully'
    });

  } catch (error) {
    console.error('Change wallet PIN error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get wallet statistics
exports.getWalletStats = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const user_id = req.user.id;

    const wallet = await Wallet.findOne({ where: { user_id } });
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found'
      });
    }

    const whereClause = { wallet_id: wallet.id };
    
    if (start_date && end_date) {
      whereClause.created_at = {
        [Op.between]: [new Date(start_date), new Date(end_date)]
      };
    }

    const [stats] = await Promise.all([
      {
        total_transactions: await WalletTransaction.count({ where: whereClause }),
        total_top_ups: await WalletTransaction.sum('amount', {
          where: { ...whereClause, type: 'top_up', status: 'completed' }
        }) || 0,
        total_withdrawals: await WalletTransaction.sum('amount', {
          where: { ...whereClause, type: 'withdrawal', status: 'completed' }
        }) || 0,
        total_transfers_out: await WalletTransaction.sum('amount', {
          where: { ...whereClause, type: 'transfer_out', status: 'completed' }
        }) || 0,
        total_transfers_in: await WalletTransaction.sum('amount', {
          where: { ...whereClause, type: 'transfer_in', status: 'completed' }
        }) || 0,
        current_balance: wallet.current_balance,
        pending_balance: wallet.pending_balance,
        frozen_balance: wallet.frozen_balance,
        available_balance: wallet.getAvailableBalance()
      }
    ]);

    res.json({
      success: true,
      data: { stats }
    });

  } catch (error) {
    console.error('Get wallet stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};