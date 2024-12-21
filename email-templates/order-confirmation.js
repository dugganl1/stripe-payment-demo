function getOrderConfirmationEmail(orderDetails) {
  return `
        <!DOCTYPE html>
        <html>
            <body style="margin: 0; padding: 0; background-color: #f6f9fc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                <table role="presentation" style="width: 100%; border: none; margin: 0; padding: 40px;">
                    <tr>
                        <td>
                            <table role="presentation" style="max-width: 600px; border: none; margin: 0 auto; padding: 20px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                                <!-- Header -->
                                <tr>
                                    <td style="text-align: center; padding: 20px;">
                                        <h1 style="color: #1a1a1a; margin: 0; font-size: 24px; font-weight: 600;">Order Confirmed</h1>
                                    </td>
                                </tr>
                                
                                <!-- Main Content -->
                                <tr>
                                    <td style="padding: 20px;">
                                        <p style="color: #444; font-size: 16px; line-height: 24px; margin: 0 0 16px;">Thank you for your purchase!</p>
                                        <p style="color: #444; font-size: 16px; line-height: 24px; margin: 0 0 24px;">Order ID: ${
                                          orderDetails.id
                                        }</p>
                                        
                                        <!-- Order Details Box -->
                                        <table role="presentation" style="width: 100%; background-color: #f8fafc; border-radius: 4px; margin: 0 0 24px;">
                                            <tr>
                                                <td style="padding: 16px;">
                                                    <p style="margin: 0; color: #666;">Amount paid: <strong style="color: #1a1a1a;">$${
                                                      orderDetails.amount / 100
                                                    }</strong></p>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <!-- Download Button -->
                                        <table role="presentation" style="width: 100%; margin: 0 0 24px;">
                                            <tr>
                                                <td align="center">
                                                    <a href="${
                                                      orderDetails.downloadLink
                                                    }" style="display: inline-block; background-color: #5469d4; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 4px; font-weight: 600;">Download Template</a>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <p style="color: #666; font-size: 14px; margin: 0;">This download link will expire in 24 hours.</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
        </html>
    `;
}

module.exports = getOrderConfirmationEmail;
