# Innmotek Database Cleanup & Content Action Items

This document tracks items flagged during the pre-migration database dump audit.

---

## 1. Confirmed-Delete List (To be removed before final production migration)

These records are confirmed test/dummy data and should be purged before production deployment:

| Table | ID | Title / Name | Created At | Reason | Status |
|:---|:---|:---|:---|:---|:---|
| `banners` | 25 | Hello New | 2024-09-20 05:20:09 | Developer test record created during development | Queued for migration cleanup |

---

## 2. Needs Real Content Written (Incomplete / Placeholder Body Copy)

These records represent **legitimate products, categories, and site pages** with authentic titles, but their body descriptions currently contain placeholder *Lorem Ipsum* text from initial agency scaffolding. These require real copy to be written before marketing launch:

### A. Products Table (`products`)
- **ID 1**: Split Heat Pump Water Heater : PBHW-0054-S
- **ID 4**: Commercial Heat Pump Water Heater : IMHP-0076-C
- **ID 5**: Split Heat Pump Water Heater : PBHW-012-S
- **ID 6**: Swimming Pool Heat Pump : PBHP-0021-SP
- **ID 7**: All in One 300 Litres Heat Pump
- **ID 8**: Split Heat Pump Water Heater : IMHW-0054-S
- **ID 9**: Split Heat Pump Water Heater : IMHW-0076-S
- **ID 11**: M Thermal Arctic Series ATW Heat Pump
- **ID 13**: Electrical Fireplace
- **ID 14**: Wood Fired Fireplace (NB-WS2)
- **ID 15**: Wood Fired Fireplace (HELIX)
- **ID 16**: Infrared Heater (THE-FIHP18D)
- **ID 17**: Infrared Heater (THE-FIHP20D)
- **ID 18**: Metal Panel Convector Heaters – NDM 20D
- **ID 19**: Commercial Heat Pump Water Heater (Direct Heating)
- **ID 20**: Glass Lined Hot Water Storage Tank
- **ID 21**: Mars Series R290 All Inverter Air Source Heat Pump
- **ID 24**: Infrared Heater (IM-IH-2000-O)
- **ID 28**: Wood Fired Fireplace (IM-WFS-5510448)
- **ID 31**: Wood Fired Fireplace (CRAFTSBURY)
- **ID 34**: Split Heat Pump Water Heater : IMHW-0108-S
- **ID 35**: Split Heat Pump Water Heater : IMHW-0132-S

### B. Blogs Table (`blogs`)
- **ID 1**: Recent Commercial Estate Transactions (Body contains template copy)
- **ID 3**: The Efficiency Revolution: Exploring Inverter Pool Heat Pumps (Description has placeholder text)
- **ID 4**: Dehumidifiers: Creating Comfortable and Healthy Indoor Spaces (Description has placeholder text)

### C. Services Table (`services`)
- **ID 1**: Industrial Service (Body copy contains Lorem Ipsum)

### D. FAQs Table (`faqs`)
- **ID 6**: "Can the house be cooled in summer and heated in winter with aerothermal energy?" (Answer body has placeholder text)

### E. Static Pages Table (`pages`)
- **ID 1**: Privacy Policy (Template placeholder text)
- **ID 2**: Terms & conditions (Draft placeholder)
- **ID 3**: Payment Policy (Draft placeholder)
- **ID 4**: Dealer Policy (Draft placeholder)
- **ID 5**: Company Policy (Draft placeholder)
