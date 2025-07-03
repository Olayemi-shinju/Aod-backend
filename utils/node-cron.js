import cron from 'node-cron';
import Product from './models/productModel.js'; // adjust path as needed
import sendEmail from './utils/sendEmail.js'; // hypothetical sendgrid email helper

// Function to check low stock and send notification
async function checkLowStockAndNotify() {
  try {
    const lowStockProducts = await Product.find({ quantity: { $lt: 5 } }).select('name quantity brand images');
    if (lowStockProducts.length > 0) {
      // Format email content
      const productList = lowStockProducts.map(p => `${p.name} (Qty: ${p.quantity})`).join('\n');

      const emailContent = `
        <h3>AOD Solatricity</h3>
        <h3>Low Stock Alert</h3>
        <p>The following products are low in stock:</p>
        <pre>${productList}</pre>
      `;

      // Send email to admin
      await sendEmail({
        to: 'a.o.dsolatricity@gmail.com',
        subject: 'Low Stock Products Alert',
        html: emailContent,
      });

      console.log('Low stock alert email sent.');
    } else {
      console.log('No low stock products at this time.');
    }
  } catch (error) {
    console.error('Error checking low stock:', error);
  }
}

// Schedule the job to run every day at 9:00 AM server time
cron.schedule('0 9 * * *', () => {
  console.log('Running scheduled low stock check...');
  checkLowStockAndNotify();
});

export default checkLowStockAndNotify;
