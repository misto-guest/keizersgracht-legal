# Warmup Routines & Address Generation

## 🎯 Warmup Routine Profiles

### Available Routines

| Routine | Activities | Duration | Intensity | Best For |
|---------|-----------|----------|-----------|----------|
| **BASIC** | 3 | 5-10 min | Light | New accounts (0-7 days) |
| **STANDARD** | 5 | 10-15 min | Medium | Early warmup (7-14 days) |
| **AGGRESSIVE** | 8 | 20-30 min | High | Fast tracking |
| **GOOGLE_WORKSPACE** | 5 | 15-20 min | Medium | Professional accounts |
| **CONTENT_CREATOR** | 5 | 15-25 min | Medium-High | YouTube-focused |
| **BUSINESS_PROFESSIONAL** | 6 | 15-20 min | Medium | Business accounts |
| **CASUAL_USER** | 4 | 10-15 min | Light-Medium | Maintenance |
| **FULL_WARMUP** | 11 | 30-45 min | Maximum | Complete warmup |

### Warmup Schedules by Account Age

| Account Age | Schedule | Frequency | Duration |
|-------------|----------|-----------|----------|
| **0-7 days** | New Account | 2x/day | 3-7 days |
| **7-14 days** | Early Warmup | 2-3x/day | 7 days |
| **14-30 days** | Active Warmup | 3x/day | 14 days |
| **30+ days** | Maintenance | 1x/day | Ongoing |

---

## 🌍 Address Generation

### Supported Countries

#### 🇳🇱 Netherlands (NL)
- **Cities:** Amsterdam, Rotterdam, The Hague, Utrecht, Eindhoven, Groningen, Tilburg, Almere, Breda, Nijmegen
- **Postal Format:** `1234 AB` (4 digits + 2 letters)
- **Phone Format:** `06-XXXXXXXX` or `020-XXXXXXXX`
- **Address:** Street + house number + postal code + city

#### 🇩🇪 Germany (DE)
- **Cities:** Berlin, Hamburg, Munich, Cologne, Frankfurt, Stuttgart, Düsseldorf, Leipzig, Dresden, Hannover
- **Postal Format:** `12345` (5 digits)
- **Phone Format:** `015X-XXXXXXX` or `030-XXXXXXX`
- **Address:** Street + house number + postal code + city

#### 🇬🇧 United Kingdom (UK)
- **Cities:** London, Birmingham, Manchester, Leeds, Glasgow, Edinburgh, Liverpool, Bristol, Sheffield, Newcastle
- **Postal Format:** `SW1A 1AA` (outward + inward codes)
- **Phone Format:** `07XXX XXXXXX` or `020 XXXX XXXX`
- **Address:** House number + street + city + postcode

#### 🇺🇸 United States (US)
- **Cities:** New York, Los Angeles, Chicago, Houston, Phoenix, Philadelphia, San Antonio, San Diego, Dallas, San Jose
- **Postal Format:** `12345` (5 digits or 12345-6789)
- **Phone Format:** `(XXX) XXX-XXXX`
- **Address:** House number + street + city, state ZIP

### Usage Examples

```bash
# Generate 5 Dutch addresses
node address-generator.js 5 NL

# Generate 3 German addresses and save
node address-generator.js 3 DE --save

# Generate samples for all countries
node address-generator.js all
```

---

## 💳 VCC Integration

### Adding VCC to Accounts

```bash
# Test warmup + VCC addition
node test-warmup-with-vcc.js k12am9a2

# VCC details are predefined in TEST_VCC object:
# - Cardholder: Bram van der Veer
# - Number: 5236 8601 5851 1545
# - Expiry: 02/32
# - CVC: 200
# - Type: Mastercard debit
# - Billing: Okemos, MI 48864
```

### Dashboard VCC Tracking

After running VCC test, the dashboard tracks:
- `vccAdded`: boolean
- `vccLastDigits`: last 4 digits
- `vccType`: Mastercard/Visa/etc
- `vccAddedAt`: timestamp

---

## 🚀 Deployment

### Start Dashboard

```bash
# Deploy dashboard as background service
./deploy-dashboard.sh

# Or specify port
PORT=3001 ./deploy-dashboard.sh
```

### Stop Dashboard

```bash
./stop-dashboard.sh
```

### View Logs

```bash
tail -f logs/dashboard.log
```

---

## 📋 Warmup Routine Commands

```bash
# List all routines
node warmup-routines.js list

# List schedules
node warmup-routines.js schedules

# Generate activity plan
node warmup-routines.js plan STANDARD k12am9a2

# Generate and save plan
node warmup-routines.js plan STANDARD k12am9a2 --save
```

---

## 🎨 Routine Examples

### BASIC (New Accounts)
```
1. Gmail
2. Google Search
3. YouTube Watch
```

### STANDARD (Early Warmup)
```
1. Gmail
2. Google Search
3. YouTube Watch
4. Google Maps
5. Google Alerts
```

### GOOGLE_WORKSPACE (Professional)
```
1. Gmail
2. Google Docs
3. Google Sheets
4. Google Drive
5. Google Calendar
```

### FULL_WARMUP (Complete)
```
1. Gmail
2. Google Search
3. YouTube Watch + Subscribe + Like
4. Google Maps
5. Google Alerts
6. Google Docs
7. Google Sheets
8. Google Photos
9. Google Drive
```

---

## 📊 Profile Data Structure

Generated profiles include:
- `firstName` - Random first name
- `lastName` - Country-appropriate last name
- `fullName` - Full name
- `birthDate` - Random birth date (1970-2000)
- `address` - Full address object
  - `street` - Street name
  - `houseNumber` - House number
  - `postalCode` - Postal/ZIP code
  - `city` - City name
  - `state` - State (US only)
  - `fullAddress` - Complete address string
  - `phone` - Phone number
  - `coords` - GPS coordinates
- `email` - Gmail address (assigned)
- `phone` - Phone number
- `age` - Current age
- `nationality` - Country name

---

## 🔗 Best Sources for Addresses

### Netherlands
- **Postcode.nl** - Official postal database
- **Atlas.nl** - Dutch address database
- **Kadaster.nl** - Land registry (official)

### Germany
- **Bundesnetzagentur** - Postal codes
- **OpenAddressData.org** - Open source
- **GeoNames.org** - Geographical database

### United Kingdom
- **Royal Mail** - PAF (Postcode Address File)
- **OS OpenData** - Ordnance Survey
- **OpenAddressData.org** - Open source

### United States
- **USPS** - Official ZIP code database
- **Census.gov** - Address database
- **OpenAddressData.org** - Open source

---

## ✨ Summary of New Features

1. ✅ **8 Warmup Routines** - Different strategies for various use cases
2. ✅ **4 Address Generators** - NL, DE, UK, US with realistic data
3. ✅ **VCC Integration** - Add payment methods to Google accounts
4. ✅ **Dashboard Deployment** - Background service with logging
5. ✅ **2FA Web-Based** - Opens browser for manual completion
6. ✅ **Activity Plans** - Generate and save warmup plans
7. ✅ **Schedule System** - Age-based warmup recommendations

---

**Total New Code:** ~58 KB across 6 files

All features integrated with existing warmup system!
