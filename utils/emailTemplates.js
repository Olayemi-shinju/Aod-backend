// import {logo} from '../images/Logo.png'

export const generateOrderEmail = ({ user, cartItems, street, landmark, region, notes }) => {
  const orderedItemsHtml = cartItems.map(item => `
    <li style="margin-bottom: 6px;">
      <strong>${item.product.name}</strong> × ${item.quantity} — ₦${item.product.price * item.quantity}
    </li>
  `).join("");

  return `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <div style="text-align: center; margin-bottom: 20px;">
        <img src="" alt="aod.png" />
        <h2 style="color: #2c3e50;">AOD Solatricity</h2>
      </div>

      <h3>Hi ${user.name || "Customer"},</h3>
      <p>Thanks for placing your order! 🎉</p>

      <h4>🧾 Order Details:</h4>
      <ul style="list-style-type: none; padding-left: 0;">
        ${orderedItemsHtml}
      </ul>

      <p><strong>📍 Delivery Address:</strong> ${street}, ${landmark}, ${region}</p>
      <p><strong>📝 Note:</strong> ${notes}</p>

    

      <hr style="margin: 40px 0;" />
      <p style="font-size: 12px; color: #888;">© ${new Date().getFullYear()} AOD Solatricy teams. All rights reserved.</p>
    </div>
  `;
};

export const generateCancelEmail = () => {
  return `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <div style="text-align: center; margin-bottom: 20px;">
        <img src="" alt="aod.png" />
        <h2 style="color: #e74c3c;">AOD Solatricity</h2>
      </div>

      <h3>Hello,</h3>
      <p>Your order has been <strong style="color: #e74c3c;">cancelled</strong> successfully.</p>

      <p>If this was a mistake, please contact our support team immediately.</p>

      <hr style="margin: 40px 0;" />
      <p style="font-size: 12px; color: #888;">© ${new Date().getFullYear()} AOD Solatricity. All rights reserved.</p>
    </div>
  `;
};
