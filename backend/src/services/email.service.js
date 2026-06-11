/**
 * EmailService — Envío de emails transaccionales con Nodemailer.
 */
const nodemailer = require("nodemailer");

class EmailService {
  constructor() { this._transporter = null; }

  _getTransporter() {
    if (this._transporter) return this._transporter;
    this._transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    return this._transporter;
  }

  async enviar({ to, subject, html }) {
    if (!process.env.SMTP_USER || process.env.SMTP_USER === "tu-email@gmail.com") {
      console.log(`[Email] SMTP no configurado — email a ${to} omitido`);
      return;
    }
    try {
      await this._getTransporter().sendMail({
        from: process.env.SMTP_FROM || `"Aurea" <${process.env.SMTP_USER}>`,
        to, subject, html,
      });
      console.log(`[Email] Enviado a ${to}: ${subject}`);
    } catch (err) {
      console.error(`[Email] Error:`, err.message);
    }
  }

  async confirmarPedido({ email, nombre, orderNumber, items, total, direccion }) {
    const itemsHtml = items.map(item =>
      `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #f0ece6;">${item.productName}</td>
        <td style="padding:8px 0;border-bottom:1px solid #f0ece6;text-align:center;">${item.quantity}</td>
        <td style="padding:8px 0;border-bottom:1px solid #f0ece6;text-align:right;">${((item.subtotal || item.unitPrice * item.quantity) || 0).toFixed(2)} €</td>
      </tr>`).join("");

    const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f7f4f0;font-family:Georgia,serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f4f0;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#faf9f7;border:1px solid #e8e0d5;max-width:600px;">
<tr><td style="background:#1c1c1c;padding:32px 40px;text-align:center;">
  <h1 style="margin:0;color:#f5c842;font-size:28px;letter-spacing:4px;font-weight:normal;">AUREA</h1>
  <p style="margin:8px 0 0;color:#999;font-size:11px;letter-spacing:2px;">MODA CON CERTIFICADO DE AUTENTICIDAD</p>
</td></tr>
<tr><td style="padding:40px;">
  <p style="color:#1c1c1c;font-size:16px;margin:0 0 8px;">Hola, <strong>${nombre}</strong></p>
  <p style="color:#555;font-size:14px;margin:0 0 24px;">Tu pedido ha sido confirmado. Gracias por confiar en Aurea.</p>
  <div style="background:#f0ece6;padding:16px 20px;margin-bottom:24px;">
    <p style="margin:0;font-size:11px;color:#888;letter-spacing:1px;text-transform:uppercase;">Número de pedido</p>
    <p style="margin:4px 0 0;font-size:20px;color:#1c1c1c;font-weight:bold;">${orderNumber}</p>
  </div>
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
    <tr style="border-bottom:2px solid #1c1c1c;">
      <th style="text-align:left;padding:8px 0;font-size:11px;color:#888;text-transform:uppercase;">Producto</th>
      <th style="text-align:center;padding:8px 0;font-size:11px;color:#888;text-transform:uppercase;">Cant.</th>
      <th style="text-align:right;padding:8px 0;font-size:11px;color:#888;text-transform:uppercase;">Precio</th>
    </tr>
    ${itemsHtml}
    <tr>
      <td colspan="2" style="padding:12px 0 0;font-size:14px;color:#888;text-transform:uppercase;">Total</td>
      <td style="padding:12px 0 0;text-align:right;font-size:18px;font-weight:bold;color:#1c1c1c;">${total.toFixed(2)} €</td>
    </tr>
  </table>
  <div style="border-top:1px solid #e8e0d5;padding-top:20px;margin-bottom:24px;">
    <p style="font-size:11px;color:#888;text-transform:uppercase;margin:0 0 8px;">Dirección de envío</p>
    <p style="font-size:14px;color:#555;margin:0;line-height:1.6;">${(direccion && direccion.recipient) || nombre}<br>${(direccion && direccion.line1) || ""}<br>${(direccion && direccion.city) || ""} ${(direccion && direccion.postalCode) || ""}</p>
  </div>
  <div style="background:#1c1c1c;padding:20px;text-align:center;">
    <p style="color:#f5c842;font-size:11px;letter-spacing:2px;text-transform:uppercase;margin:0 0 4px;">Certificado blockchain incluido</p>
    <p style="color:#999;font-size:12px;margin:0;">Tu prenda incluye un certificado de autenticidad inmutable en Ethereum Sepolia.</p>
  </div>
</td></tr>
<tr><td style="padding:20px 40px;text-align:center;border-top:1px solid #e8e0d5;">
  <p style="margin:0;font-size:11px;color:#aaa;">Aurea · TFG DAW 2026</p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;

    await this.enviar({ to: email, subject: `Pedido confirmado — ${orderNumber} | Aurea`, html });
  }
}

module.exports = new EmailService();
