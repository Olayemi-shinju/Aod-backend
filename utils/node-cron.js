// utils/node-cron.js
import cron from 'node-cron';
import Product from '../models/productModel.js';
import {sendEmail} from './sendGrid.js';

const checkLowStockAndNotify = async () => {
  try {
    const lowStockProducts = await Product.find({
      quantity: { $lt: 5 },
      notifiedLowStock: { $ne: true },
    });

    if (lowStockProducts.length > 0) {
      const productList = lowStockProducts.map(p => `${p.name} (Qty: ${p.quantity})`).join('<br>');

      const emailContent = `
        <h3>AOD Solatricity</h3>
        <h4>Low Stock Alert</h4>
        <p>The following products are low in stock:</p>
        <p>${productList}</p>
      `;

      await sendEmail({
        to: process.env.FROM_EMAIL,
        subject: '📉 Low Stock Products Alert',
        html: emailContent,
      });

      await Promise.all(
        lowStockProducts.map(p =>
          Product.findByIdAndUpdate(p._id, { notifiedLowStock: true })
        )
      );

      console.log('✅ Low stock alert sent and flags updated.');
    } else {
      console.log('✅ No low stock products at this time.');
    }
  } catch (err) {
    console.error('❌ Cron job error:', err.message);
  }
};

const startCronJob = () => {
  // Runs every day at 8:15 AM
  cron.schedule('* * * * *', () => {
    console.log('⏰ Running low stock check...');
    checkLowStockAndNotify();
  });
};

export default startCronJob;
