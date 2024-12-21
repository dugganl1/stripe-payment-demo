const getOrderConfirmationEmail = (orderDetails) => {
  return `
        <!DOCTYPE html>
        <html>
            <body style="margin: 0; padding: 20px; background-color: #f6f9fc; font-family: Arial, sans-serif;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                    <h1 style="color: #1a1a1a; margin: 0 0 20px; font-size: 24px; text-align: center;">Order Confirmed</h1>
                    
                    <p style="color: #444; margin: 0 0 10px;">Thank you for your purchase!</p>
                    <p style="color: #444; margin: 0 0 20px;">Order ID: ${orderDetails.id}</p>
                    
                    <div style="background-color: #f8fafc; padding: 15px; border-radius: 4px; margin-bottom: 20px;">
                        <p style="margin: 0; color: #666;">Amount paid: <strong style="color: #1a1a1a;">$${
                          orderDetails.amount / 100
                        }</strong></p>
                    </div>

                    <div style="text-align: center; margin: 20px 0;">
                        <a href="${
                          orderDetails.downloadLink
                        }" style="display: inline-block; background-color: #5469d4; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 4px; font-weight: bold;">Download Template</a>
                    </div>

                    <p style="color: #666; font-size: 14px; margin: 0; text-align: center;">This download link will expire in 24 hours.</p>
                </div>
            </body>
        </html>
    `;
};

module.exports = getOrderConfirmationEmail;
