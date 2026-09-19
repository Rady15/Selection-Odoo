import { Order } from '../types';

interface TaxInvoiceSettings {
 store_name_ar?: string;
 store_name_en?: string;
 vat_number?: string;
 vat_rate?: number;
 support_phone?: string;
 support_email?: string;
 address_ar?: string;
 address_en?: string;
}

interface TaxInvoiceOptions {
 language: 'ar' | 'en';
 formatPrice: (value: number) => string;
 settings?: TaxInvoiceSettings | null;
}

const fallbackSettings: TaxInvoiceSettings = {
 store_name_ar: 'محمصة سليكشن للقهوة',
 store_name_en: 'Selection Specialty Coffee Roasters',
 vat_number: '310928374800003',
 vat_rate: 0.15,
 support_phone: '+966 9200 12345',
 support_email: 'care@selection.coffee',
 address_ar: 'طريق الملك فهد - حي حطين - الرياض - المملكة العربية السعودية',
 address_en: 'King Fahd Road - Hittin Dist. - Riyadh - Saudi Arabia'
};

const PAYMENT_LABELS: Record<string, [string, string]> = {
 mada: ['مدى', 'Mada'],
 visa: ['فيزا / ماستركارد', 'Visa / Mastercard'],
 apple_pay: ['Apple Pay', 'Apple Pay'],
 cod: ['الدفع عند الاستلام', 'Cash on Delivery']
};

const PAYMENT_STATUS_LABELS: Record<string, [string, string]> = {
 paid: ['مدفوع', 'Paid'],
 pending: ['قيد الدفع', 'Pending'],
 failed: ['فشل الدفع', 'Failed']
};

export function printTaxInvoice(order: Order, opts: TaxInvoiceOptions): void {
 const { language, formatPrice } = opts;
 const t = (ar: string, en: string) => (language === 'ar' ? ar : en);
 const dir = language === 'ar' ? 'rtl' : 'ltr';

 const win = window.open('', '_blank', 'width=880,height=1000');
 if (!win) {
 window.alert(t('الرجاء السماح بالنوافذ المنبثقة لطباعة الفاتورة الضريبية', 'Please allow pop-ups to print the tax invoice'));
 return;
 }

 win.document.write(
 `<!DOCTYPE html><html lang="${language === 'ar' ? 'ar' : 'en'}" dir="${dir}">` +
 `<head><meta charset="utf-8"/><title>${t('فاتورة ضريبية', 'Tax Invoice')}</title></head>` +
 `<body style="margin:0;background:#fff;font-family:'Segoe UI',Tahoma,Arial,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;color:#6F8C8E">` +
 t('جارٍ تجهيز الفاتورة…', 'Preparing invoice…') +
 `</body></html>`
 );
 win.document.close();

 const render = (settings: TaxInvoiceSettings) => {
 const storeName = language === 'ar' ? settings.store_name_ar || fallbackSettings.store_name_ar : settings.store_name_en || fallbackSettings.store_name_en;
 const address = language === 'ar' ? settings.address_ar || fallbackSettings.address_ar : settings.address_en || fallbackSettings.address_en;
 const vatNumber = settings.vat_number || fallbackSettings.vat_number;
 const vatRate = settings.vat_rate || fallbackSettings.vat_rate || 0.15;
 const vatBase = Math.max(0, order.subtotal - order.discount_amount - (order.loyalty_discount || 0));

 const esc = (s: string) => String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

 const shipAddress = order.shipping_address
 ? [order.shipping_address.city, order.shipping_address.district, order.shipping_address.street].filter(Boolean).join(' - ')
 : '';

 const itemsRows = order.items.map((item: any, idx) => {
 const name = language === 'ar' ? (item.product_name_ar || item.name_ar) : (item.product_name_en || item.name_en);
 const qty = Number(item.quantity) || 1;
 const unitPrice = typeof item.unit_price === 'number' ? item.unit_price : item.price;
 const totalPrice = typeof item.total_price === 'number' ? item.total_price : (item.unit_price || item.price) * qty;
 const detail = [item.weight, item.grind, item.sku ? `SKU: ${item.sku}` : ''].filter(Boolean).join(' • ');
 return `
 <tr>
 <td class="num muted" style="width:34px">${idx + 1}</td>
 <td>
 <div class="item-name">${esc(name || '-')}</div>
 ${detail ? `<div class="item-detail">${esc(detail)}</div>` : ''}
 </td>
 <td class="num">${qty}</td>
 <td class="num">${formatPrice(unitPrice || 0)}</td>
 <td class="num strong">${formatPrice(totalPrice || 0)}</td>
 </tr>
 `;
 }).join('');

 const totalsRow = (label: string, value: string, style = '') => `
 <div class="row" style="${style}"><span class="k">${label}</span><span dir="ltr">${value}</span></div>
 `;

 const html = `<!DOCTYPE html>
<html lang="${language === 'ar' ? 'ar' : 'en'}" dir="${dir}">
<head>
 <meta charset="utf-8" />
 <title>${t('فاتورة ضريبية', 'Tax Invoice')} - ${esc(order.order_number)}</title>
 <style>
 @page { size: A4; margin: 12mm; }
 * { box-sizing: border-box; }
 body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; color: #1A2E30; margin: 0; padding: 26px; font-size: 13px; background: #fff; }
 .invoice { max-width: 780px; margin: 0 auto; }
 .header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; border-bottom: 2px solid #0E5257; padding-bottom: 14px; }
 .brand { display: flex; align-items: center; gap: 14px; }
 .brand img { height: 50px; width: auto; object-fit: contain; }
 .brand h1 { font-size: 21px; margin: 0 0 2px; color: #0E5257; }
 .brand .store { font-size: 11.5px; color: #496A6D; }
 .brand .contact { font-size: 10.5px; color: #6F8C8E; margin-top: 6px; line-height: 1.6; }
 .doctype { text-align: center; }
 .doctype .badge { display: inline-block; background: #0E5257; color: #fff; font-weight: 800; padding: 7px 20px; border-radius: 6px; font-size: 15px; letter-spacing: 1px; }
 .doctype .vat-badge { margin-top: 7px; font-size: 11px; color: #496A6D; }
 .doctype .vat-badge strong { color: #1A2E30; }
 .invoice-no { margin-top: 6px; font-size: 12px; }
 .invoice-no strong { font-family: 'Courier New', Courier, monospace; font-size: 14px; color: #0E5257; letter-spacing: 0.5px; }
 .panel { border: 1px solid #1A2E30; border-radius: 8px; padding: 12px 14px; margin-top: 12px; }
 .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 5px 18px; font-size: 12.5px; }
 .meta .k { color: #6F8C8E; }
 .meta .v { font-weight: 700; }
 .buyer { background: #F5FBFB; }
 .buyer h3 { margin: 0 0 7px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #6F8C8E; }
 .buyer .line { font-size: 12.5px; margin-bottom: 3px; }
 .buyer .line .k { color: #6F8C8E; }
 table.items { width: 100%; border-collapse: collapse; margin-top: 14px; font-size: 12.5px; }
 table.items th { background: #0E5257; color: #fff; padding: 8px 10px; font-size: 11.5px; font-weight: 700; text-align: start; }
 table.items td { padding: 8px 10px; border-bottom: 1px solid #E3F0F1; vertical-align: top; }
 table.items tbody tr:nth-child(even) td { background: #F5FBFB; }
 .num { text-align: end; white-space: nowrap; }
 .muted { color: #6F8C8E; }
 .strong { font-weight: 700; }
 .item-name { font-weight: 600; }
 .item-detail { font-size: 11px; color: #496A6D; }
 .totals { margin-top: 14px; margin-inline-start: auto; width: 330px; }
 .totals .row { display: flex; justify-content: space-between; padding: 3px 0; font-size: 12.5px; }
 .totals .row .k { color: #496A6D; }
 .totals .vat-box { background: #EAF4F5; border-radius: 6px; padding: 8px 10px; margin-top: 8px; border-top: 1px dashed #B5CBCC; }
 .totals .vat-box .row .k { color: #4A6869; }
 .totals .grand { border-top: 2px solid #0E5257; margin-top: 8px; padding-top: 9px; font-size: 16px; font-weight: 800; }
 .totals .grand .k { color: #1A2E30; }
 .totals .grand span:last-child { color: #0E5257; }
 .foot { margin-top: 22px; border-top: 2px solid #0E5257; padding-top: 10px; font-size: 11px; color: #6F8C8E; display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
 .foot .note { max-width: 460px; line-height: 1.6; }
 .pay-badge { display: inline-block; padding: 3px 12px; border-radius: 20px; font-size: 11px; font-weight: 800; }
 .pay-paid { background: #e8f5e9; color: #1b5e20; }
 .pay-pending { background: #fff3e0; color: #4FA8AD; }
 .pay-failed { background: #fdecea; color: #b71c1c; }
 .no-print { text-align: center; margin-top: 18px; }
 .no-print button { background: #0E5257; color: #fff; border: none; padding: 10px 26px; border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer; }
 .no-print button:hover { background: #2B7D82; }
 @media print {
 body { padding: 0; }
 .no-print { display: none !important; }
 }
 </style>
</head>
<body>
 <div class="invoice">
 <div class="header">
 <div class="brand">
 <img src="/coloredlogo.png" alt="Selection" />
 <div>
 <h1>${esc(storeName)}</h1>
 <div class="store">${t('قهوة مختصة - تحميص يومي طازج', 'Specialty coffee roasters - fresh daily roast')}</div>
 <div class="contact">
 <div>${esc(address)}</div>
 <div dir="ltr">${esc(settings.support_phone || fallbackSettings.support_phone || '')}${settings.support_email ? ` • ${esc(settings.support_email)}` : ''}</div>
 </div>
 </div>
 </div>
 <div class="doctype">
 <div class="badge">${t('فاتورة ضريبية', 'TAX INVOICE')}</div>
 <div class="vat-badge">${t('الرقم الضريبي:', 'VAT No.:')} <strong dir="ltr">${esc(vatNumber)}</strong></div>
 <div class="invoice-no">${t('رقم الفاتورة:', 'Invoice No.:')} <strong dir="ltr">${esc(order.order_number)}</strong></div>
 </div>
 </div>

 <div class="panel meta">
 <div><span class="k">${t('التاريخ:', 'Date:')}</span> <span class="v">${new Date(order.created_at).toLocaleString(language === 'ar' ? 'ar-SA-u-ca-gregory' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</span></div>
 <div><span class="k">${t('حالة الدفع:', 'Payment:')}</span> <span class="pay-badge ${order.payment_status === 'paid' ? 'pay-paid' : order.payment_status === 'pending' ? 'pay-pending' : 'pay-failed'}">${language === 'ar' ? (PAYMENT_STATUS_LABELS[order.payment_status]?.[0] || order.payment_status) : (PAYMENT_STATUS_LABELS[order.payment_status]?.[1] || order.payment_status)}</span></div>
 <div><span class="k">${t('العميل:', 'Customer:')}</span> <span class="v">${esc(order.customer_name)}</span></div>
 <div><span class="k">${t('طريقة الدفع:', 'Payment Method:')}</span> <span class="v">${language === 'ar' ? (PAYMENT_LABELS[order.payment_method]?.[0] || order.payment_method) : (PAYMENT_LABELS[order.payment_method]?.[1] || order.payment_method)}</span></div>
 <div><span class="k">${t('الهاتف:', 'Phone:')}</span> <span class="v" dir="ltr">${esc(order.phone)}</span></div>
 ${order.tracking_number ? `<div><span class="k">${t('رقم التتبع:', 'Tracking No.:')}</span> <span class="v" dir="ltr">${esc(order.tracking_number)}</span></div>` : ''}
 </div>

 <div class="panel buyer">
 <h3>${t('بيانات العميل / بيانات التوصيل', 'CUSTOMER / DELIVERY DETAILS')}</h3>
 <div class="line"><span class="k">${t('الاسم:', 'Name:')}</span> <strong>${esc(order.customer_name)}</strong></div>
 ${order.email ? `<div class="line"><span class="k">${t('البريد:', 'Email:')}</span> ${esc(order.email)}</div>` : ''}
 ${order.phone ? `<div class="line"><span class="k">${t('الهاتف:', 'Phone:')}</span> <span dir="ltr">${esc(order.phone)}</span></div>` : ''}
 ${shipAddress ? `<div class="line"><span class="k">${t('العنوان:', 'Address:')}</span> ${esc(shipAddress)}</div>` : ''}
 ${order.customer_notes ? `<div class="line"><span class="k">${t('ملاحظات:', 'Notes:')}</span> ${esc(order.customer_notes)}</div>` : ''}
 </div>

 <table class="items">
 <thead>
 <tr>
 <th style="width:34px">#</th>
 <th>${t('المنتج', 'Item')}</th>
 <th class="num">${t('الكمية', 'Qty')}</th>
 <th class="num">${t('سعر الوحدة', 'Unit Price')}</th>
 <th class="num">${t('الإجمالي', 'Amount')}</th>
 </tr>
 </thead>
 <tbody>
 ${itemsRows}
 </tbody>
 </table>

 <div class="totals">
 ${totalsRow(t('المجموع الفرعي', 'Subtotal'), formatPrice(order.subtotal))}
 ${order.discount_amount > 0 ? totalsRow(t('الخصم', 'Discount'), '-' + formatPrice(order.discount_amount), 'color:#1b5e20') : ''}
 ${order.loyalty_discount && order.loyalty_discount > 0 ? totalsRow(t('خصم الولاء', 'Loyalty Discount'), '-' + formatPrice(order.loyalty_discount), 'color:#4FA8AD') : ''}
 ${totalsRow(t('الشحن', 'Shipping'), order.shipping_cost > 0 ? formatPrice(order.shipping_cost) : t('مجاني', 'FREE'))}
 ${order.cod_surcharge && order.cod_surcharge > 0 ? totalsRow(t('رسوم الدفع عند الاستلام', 'COD Surcharge'), '+' + formatPrice(order.cod_surcharge), 'color:#4FA8AD') : ''}

 <div class="vat-box">
 ${totalsRow(t('المبلغ الخاضع لضريبة القيمة المضافة', 'Amount subject to VAT'), formatPrice(vatBase))}
 ${totalsRow(t(`ضريبة القيمة المضافة (${Math.round(vatRate * 100)}%)`, `VAT (${Math.round(vatRate * 100)}%)`), formatPrice(order.tax_amount), 'font-weight:700')}
 </div>

 <div class="row grand">
 <span class="k">${t('الإجمالي شامل ضريبة القيمة المضافة', 'Total incl. VAT')}</span>
 <span dir="ltr">${formatPrice(order.total_amount)}</span>
 </div>
 </div>

 <div class="foot">
 <div class="note">
 ${t('فاتورة ضريبية صادرة وفقاً لأحكام ضريبة القيمة المضافة في المملكة العربية السعودية. شكراً لتسوقك من سليكشن.', 'Tax invoice issued in accordance with the Saudi VAT regulations. Thank you for shopping with Selection.')}
 </div>
 <div>
 ${t('تاريخ الإصدار:', 'Issued:')} ${new Date().toLocaleString(language === 'ar' ? 'ar-SA-u-ca-gregory' : 'en-GB', { dateStyle: 'short', timeStyle: 'short' })}
 </div>
 </div>

 <div class="no-print">
 <button onclick="window.print()">${t('طباعة', 'Print')}</button>
 </div>
 </div>
</body>
</html>`;

 win.document.open();
 win.document.write(html);
 win.document.close();
 win.focus();
 setTimeout(() => win.print(), 350);
 };

 if (opts.settings) {
 render(opts.settings);
 return;
 }

 fetch('/api/public/settings')
 .then(res => (res.ok ? res.json() : fallbackSettings))
 .catch(() => fallbackSettings)
 .then(render);
}
