# VCC Addition Process

## 2026-02-04: VCC Added to Gmail Account

### VCC Details (Shared Card)

**Card Information:**
- **Cardholder:** Bram van der Veer
- **Card Number:** 5236 8601 5851 1545
- **Last 4 Digits:** 1545
- **Expiry:** 02/32
- **CVC:** 200
- **Type:** Mastercard debit
- **Label:** MA-2

**Billing Address:**
- **Street:** 4365 Okemos Rd
- **City:** Okemos
- **State:** MI
- **ZIP Code:** 48864
- **Country:** United States

### Profile Used

- **Profile ID:** k12am9a2
- **Email:** patmcgee727@gmail.com
- **Name:** Pat McGee
- **Status:** New account being warmed up

### Addition Process

**Script:** `add-vcc-automated.js`

**Steps:**
1. Launch AdsPower profile (k12am9a2)
2. Connect Puppeteer
3. Navigate to Google Payments (pay.google.com)
4. Find Payment Methods section
5. Click "Add payment method"
6. Fill in card details:
   - Card number: 5236860158511545
   - Name: Bram van der Veer
   - Expiry: 02/32
   - CVC: 200
7. Verify billing address (Okemos, MI 48864)
8. Submit card details
9. Wait for confirmation
10. Update account status

**Screenshots Saved:** `./screenshots/vcc-automated/`
- 01_payments_page.png
- 02_payment_methods.png
- 03_add_payment.png
- 04_card_filled.png
- 05_billing_address.png
- 06_submitted.png

### Account Status Update

After successful addition, `users/account-status.json` is updated with:
```json
{
  "statuses": {
    "patmcgee727@gmail.com": {
      "vccAdded": true,
      "vccLastDigits": "1545",
      "vccType": "Mastercard debit",
      "vccCardholder": "Bram van der Veer",
      "vccAddedAt": "2026-02-04T08:45:00.000Z"
    }
  }
}
```

### Purpose

Adding VCC to Gmail accounts:
- **Increases account trust** - Shows payment capability
- **Enables paid services** - Can purchase Google services
- **Verification** - Additional account verification method
- **Warmup strategy** - Part of account aging process

### Notes

- **Card is a virtual debit card** from IO bank
- **Shared for testing** warmup automation
- **Billing address in Okemos, MI** - US-based address
- **Automated process** reduces manual entry
- **Screenshots document** each step for verification

### Future Use

This VCC can be used for:
- Google Play purchases
- Google Cloud services
- YouTube Premium
- Google One storage
- Other Google paid services

### Security

- **Card details stored** in script (VCC_DETAILS constant)
- **NOT committed to git** - in .gitignore
- **Local use only** - for warmup automation
- **Virtual card** - limits exposure
