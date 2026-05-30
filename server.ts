import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";
import { AppData, Kit, KitItem, AppSettings, EmailLog } from "./src/types";

// Setup environment
import dotenv from "dotenv";
dotenv.config();

const app = express();
const PORT = 3000;

// Enable JSON body parsing (higher limit for AI imports/exports if needed)
app.use(express.json({ limit: "5mb" }));

// Resolve paths
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Default Data Seed
const DEFAULT_SETTINGS: AppSettings = {
  recipientEmails: "fake@gmail.com",
  reminderDays: 7,
  hubSubtitle: "subtitle",
  smtp: {
    enabled: false,
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    user: "fake@gmail.com",
    pass: "",
    from: "ReadySet <fake@gmail.com>",
  },
};

const DEFAULT_KITS: Kit[] = [
  {
    id: "car-kit",
    name: "Car Emergency Kit",
    description: "Kept in the vehicle trunk for roadside issues, severe weather, or unexpected roadside stranding.",
    category: "vehicle",
    createdAt: "2026-05-10T10:00:00Z",
    updatedAt: "2026-05-30T10:00:00Z",
    lastAuditedAt: "2026-05-15",
    items: [
      {
        id: "car-pants",
        name: "Spare Pair of Warm Pants",
        status: "removed",
        note: "Took out to wash/wear. Easy to track on-the-go!",
        quantity: "1 pair",
        lastChecked: "2026-05-24",
        alertOnExpiration: false,
        removedAt: "2026-05-30",
        // Reminds in 1 week (using current date + 7 days, let's set it to 1 week from today!)
        reminderDueDate: "2026-06-06",
      },
      {
        id: "car-water",
        name: "Bottled Cases of Water",
        status: "packed",
        note: "Stored inside heavy insulated container in the trunk.",
        quantity: "12 bottles",
        lastChecked: "2026-05-15",
        expirationDate: "2026-08-30", // expiring soon!
        alertOnExpiration: true,
      },
      {
        id: "car-blanket",
        name: "Thermal Wool blankets",
        status: "packed",
        note: "Heavy duty, moth-proof packed.",
        quantity: "2 blankets",
        lastChecked: "2026-05-15",
        alertOnExpiration: false,
      },
      {
        id: "car-flashlight",
        name: "Tactical flashlight & extra AA",
        status: "to-pack",
        note: "Have it in kitchen cabinet, need to load batteries and put in vehicle glovebox.",
        quantity: "1 flashlight",
        lastChecked: "2026-05-30",
        alertOnExpiration: false,
      }
    ]
  },
  {
    id: "evac-kit",
    name: "3-Day Refugee / Bug-Out Bag",
    description: "Rapid evacuation grab-and-go kit. One backpack per family member.",
    category: "evacuation",
    createdAt: "2026-05-12T11:00:00Z",
    updatedAt: "2026-05-30T12:00:00Z",
    lastAuditedAt: "2026-05-10",
    items: [
      {
        id: "evac-food",
        name: "High-Calorie Protein Bars",
        status: "expired",
        note: "Peanuts, oats, chocolate. Expired early this month!",
        quantity: "24 bars",
        lastChecked: "2026-05-10",
        expirationDate: "2026-05-10", // already expired
        alertOnExpiration: true,
      },
      {
        id: "evac-ids",
        name: "Printed Copies of Driver Licenses & Birth Certificates",
        status: "to-buy",
        note: "Laminate and place in waterproof document pouch",
        quantity: "1 set per person",
        lastChecked: "2026-05-30",
        alertOnExpiration: false,
      },
      {
        id: "evac-radio",
        name: "Solar Emergency NOAA Hand-Crank Radio",
        status: "packed",
        note: "Fully charged, stored in front compartment.",
        quantity: "1 unit",
        lastChecked: "2026-05-10",
        alertOnExpiration: false,
      },
      {
        id: "evac-firstaid",
        name: "Trauma First Aid Kit & Prescriptions",
        status: "packed",
        note: "Review contents yearly. Stored in red zipper bag.",
        quantity: "1 complete set",
        lastChecked: "2026-05-20",
        expirationDate: "2027-12-31",
        alertOnExpiration: true,
      }
    ]
  },
  {
    id: "fire-kit",
    name: "Kitchen Fire Suppression Kit",
    description: "Under-sink primary defense for grease and electric stove fires.",
    category: "fire",
    createdAt: "2026-05-15T09:00:00Z",
    updatedAt: "2026-05-15T09:10:00Z",
    lastAuditedAt: "2026-01-15",
    items: [
      {
        id: "fire-extinguisher",
        name: "Kitchen ABC Dry Chem Extinguisher",
        status: "packed",
        note: "Verify pointer is in green zone weekly.",
        quantity: "1 canister",
        lastChecked: "2026-05-20",
        expirationDate: "2031-12-31",
        alertOnExpiration: true,
      },
      {
        id: "fire-blanket",
        name: "Fiberglass Fire Blanket",
        status: "packed",
        note: "Mounted inside the pantry door - quick pull-tab design.",
        quantity: "2 blankets",
        lastChecked: "2026-01-15",
        alertOnExpiration: false,
      }
    ]
  },
  {
    id: "shelter-kit",
    name: "3-Month Shelter-in-Place Pantry",
    description: "Long-term home reserves in dry pantry and basement.",
    category: "shelter-in-place",
    createdAt: "2026-05-20T08:00:00Z",
    updatedAt: "2026-05-25T14:30:00Z",
    lastAuditedAt: "2026-04-01",
    items: [
      {
        id: "shelter-rice",
        name: "Bulk White Rice in Mylar Bags",
        status: "packed",
        note: "Sealed in food-grade buckets with oxygen absorbers. 30 year life.",
        quantity: "150 lbs",
        lastChecked: "2026-04-01",
        expirationDate: "2056-04-01",
        alertOnExpiration: true,
      },
      {
        id: "shelter-beans",
        name: "Bulk Pinto & Black Beans",
        status: "packed",
        note: "Likewise sealed for 30 year longevity.",
        quantity: "100 lbs",
        lastChecked: "2026-04-01",
        expirationDate: "2056-04-01",
        alertOnExpiration: true,
      },
      {
        id: "shelter- stove-fuel",
        name: "Butane Stove canisters",
        status: "to-buy",
        note: "Need 4 more packs of butane can sets for outdoor emergency burner.",
        quantity: "12 cans",
        lastChecked: "2026-05-30",
        alertOnExpiration: false,
      }
    ]
  }
];

// Read DB Utility
function readDB(): AppData {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initialData: AppData = {
        kits: DEFAULT_KITS,
        settings: DEFAULT_SETTINGS,
        emailLogs: [],
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
      return initialData;
    }
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to read database, returning default", e);
    return {
      kits: DEFAULT_KITS,
      settings: DEFAULT_SETTINGS,
      emailLogs: [],
    };
  }
}

// Write DB Utility
function writeDB(data: AppData) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (er) {
    console.error("Failed to write to database file", er);
  }
}

// ----------------- API Endpoints -----------------

// 1. Get entire app data
app.get("/api/data", (req, res) => {
  res.json(readDB());
});

// 2. Overwrite full data or sync
app.post("/api/data", (req, res) => {
  const incoming = req.body as AppData;
  if (!incoming || !Array.isArray(incoming.kits) || !incoming.settings) {
    return res.status(400).json({ error: "Invalid data format" });
  }
  writeDB(incoming);
  res.json({ success: true, message: "Database saved successfully" });
});

// 3. Save Settings
app.post("/api/settings", (req, res) => {
  const newSettings = req.body as AppSettings;
  if (!newSettings) {
    return res.status(400).json({ error: "Missing settings payload" });
  }
  const db = readDB();
  db.settings = newSettings;
  writeDB(db);
  res.json({ success: true, settings: db.settings });
});

// 3.5. Send Test Email
app.post("/api/send-test-email", async (req, res) => {
  const { smtp, recipient } = req.body;
  if (!smtp || !smtp.host || !smtp.user || !smtp.pass) {
    return res.status(400).json({ error: "Missing required SMTP credentials (host, user, pass)" });
  }
  const targetRecipient = recipient || smtp.user;

  try {
    const db = readDB();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiredItems: { kitName: string; item: KitItem }[] = [];
    const expiringSoonItems: { kitName: string; item: KitItem }[] = [];
    const pendingReminders: { kitName: string; item: KitItem; daysLeft: number }[] = [];

    // Parse kits for items
    db.kits.forEach(kit => {
      kit.items.forEach(item => {
        // 1. Expiration check
        if (item.expirationDate) {
          const exp = new Date(item.expirationDate);
          if (exp < today) {
            expiredItems.push({ kitName: kit.name, item });
          } else {
            // Check if expiring within 30 days
            const diffTime = Math.abs(exp.getTime() - today.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays <= 30) {
              expiringSoonItems.push({ kitName: kit.name, item });
            }
          }
        }

        // 2. "Removed" Reminders checkout
        if (item.status === 'removed' && item.reminderDueDate) {
          const due = new Date(item.reminderDueDate);
          const diffTime = due.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          pendingReminders.push({ kitName: kit.name, item, daysLeft: diffDays });
        }
      });
    });

    // If we have literally 0 issues to alert on, add some realistic test mock alerts so they can see the full alert styling!
    if (expiredItems.length === 0 && expiringSoonItems.length === 0 && pendingReminders.length === 0) {
      expiredItems.push({
        kitName: "Bug Out Bag",
        item: {
          id: "test_exp_1",
          name: "Emergency MRE Rations",
          quantity: "3",
          status: "expired",
          expirationDate: "2026-04-12",
          note: "Replace with high-calorie survival energy bars.",
          lastChecked: "2026-05-30",
          alertOnExpiration: true
        }
      });
      expiringSoonItems.push({
        kitName: "Car Safety Kit",
        item: {
          id: "test_exp_soon_1",
          name: "Triple-Antibiotic Ointment",
          quantity: "1",
          status: "to-pack",
          expirationDate: "2026-06-15",
          note: "Verify seal isn't broken on remaining tubes.",
          lastChecked: "2026-05-30",
          alertOnExpiration: true
        }
      });
      pendingReminders.push({
        kitName: "Home Disaster Supply",
        item: {
          id: "test_rem_1",
          name: "High-Capacity Powerbank 20k",
          quantity: "2",
          status: "removed",
          reminderDueDate: "2026-05-25",
          note: "Borrowed to charge family phones during camping trip.",
          lastChecked: "2026-05-30",
          alertOnExpiration: true
        },
        daysLeft: -5
      });
    }

    const totalIssueCount = expiredItems.length + expiringSoonItems.length + pendingReminders.length;

    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 24px; border: 1px solid #e1e8ed; border-radius: 8px; color: #1c1e21; background-color: #fafbfc;">
        <div style="background-color: #dc2626; padding: 20px; border-radius: 6px 6px 0 0; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">ReadySet Alert & Reminders</h1>
        </div>

        <div style="padding: 20px; background-color: #ffffff; border-radius: 0 0 6px 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
          <p style="font-size: 15px; line-height: 1.5; color: #4a5568;">Hi,</p>
          <p style="font-size: 15px; line-height: 1.5; color: #4a5568;">This is your household preparedness digest. We detected <strong>${totalIssueCount} items</strong> requiring checkups or replacements:</p>

          <!-- 1. EXPIRED SECTION -->
          ${expiredItems.length > 0 ? `
            <div style="margin-top: 25px; border-left: 4px solid #dc2626; padding-left: 14px;">
              <h2 style="color: #dc2626; font-size: 17px; margin: 0 0 10px 0; display: flex; align-items: center;">⚠️ Expired Supplies (${expiredItems.length})</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="border-bottom: 2px solid #edf2f7; text-align: left; font-size: 12px; color: #718096; text-transform: uppercase;">
                    <th style="padding: 6px 0;">Item Name</th>
                    <th style="padding: 6px 0;">Kit Location</th>
                    <th style="padding: 6px 0; text-align: right;">Expired On</th>
                  </tr>
                </thead>
                <tbody>
                  ${expiredItems.map(({ kitName, item }) => `
                    <tr style="border-bottom: 1px solid #f7fafc; font-size: 14px;">
                      <td style="padding: 10px 0; font-weight: 500; color: #2d3748;">
                        ${item.name} <span style="font-size: 12px; font-weight: normal; color: #718096; display: block;">Note: ${item.note || 'None'}</span>
                      </td>
                      <td style="padding: 10px 0; color: #4a5568;">${kitName}</td>
                      <td style="padding: 10px 0; text-align: right; color: #dc2626; font-weight: 600;">${item.expirationDate}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : ''}

          <!-- 2. EXPIRING SOON SECTION -->
          ${expiringSoonItems.length > 0 ? `
            <div style="margin-top: 25px; border-left: 4px solid #d97706; padding-left: 14px;">
              <h2 style="color: #d97706; font-size: 17px; margin: 0 0 10px 0;">⏳ Expiring Soon - within 30 Days (${expiringSoonItems.length})</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="border-bottom: 2px solid #edf2f7; text-align: left; font-size: 12px; color: #718096; text-transform: uppercase;">
                    <th style="padding: 6px 0;">Item Name</th>
                    <th style="padding: 6px 0;">Kit Location</th>
                    <th style="padding: 6px 0; text-align: right;">Expiration</th>
                  </tr>
                </thead>
                <tbody>
                  ${expiringSoonItems.map(({ kitName, item }) => `
                    <tr style="border-bottom: 1px solid #f7fafc; font-size: 14px;">
                      <td style="padding: 10px 0; font-weight: 500; color: #2d3748;">
                        ${item.name} <span style="font-size: 12px; font-weight: normal; color: #718096; display: block;">Note: ${item.note || 'None'}</span>
                      </td>
                      <td style="padding: 10px 0; color: #4a5568;">${kitName}</td>
                      <td style="padding: 10px 0; text-align: right; color: #d97706; font-weight: 600;">${item.expirationDate}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : ''}

          <!-- 3. REMOVED ITEMS checkout -->
          ${pendingReminders.length > 0 ? `
            <div style="margin-top: 25px; border-left: 4px solid #2563eb; padding-left: 14px;">
              <h2 style="color: #2563eb; font-size: 17px; margin: 0 0 10px 0;">🔄 Out of Kit Reminders (${pendingReminders.length})</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="border-bottom: 2px solid #edf2f7; text-align: left; font-size: 12px; color: #718096; text-transform: uppercase;">
                    <th style="padding: 6px 0;">Borrowed / Removed Item</th>
                    <th style="padding: 6px 0;">Kit Location</th>
                    <th style="padding: 6px 0; text-align: right;">Return Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  ${pendingReminders.map(({ kitName, item, daysLeft }) => `
                    <tr style="border-bottom: 1px solid #f7fafc; font-size: 14px;">
                      <td style="padding: 10px 0; font-weight: 500; color: #2d3748;">
                        ${item.name} <span style="font-size: 12px; font-weight: normal; display: block; color: #e53e3e;">Status: Removed (${daysLeft <= 0 ? 'Overdue!' : `${daysLeft} days left`})</span>
                        <span style="font-size: 12px; font-weight: normal; color: #718096; display: block;">${item.note || 'None'}</span>
                      </td>
                      <td style="padding: 10px 0; color: #4a5568;">${kitName}</td>
                      <td style="padding: 10px 0; text-align: right; color: #2563eb; font-weight: 600;">${item.reminderDueDate}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : ''}

          <div style="text-align: center; margin: 24px 0 12px 0;">
            <a href="http://server:7123" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 2px 4px rgba(79, 70, 229, 0.2);">Go to app</a>
          </div>

          <hr style="border: 0; border-top: 1px solid #edf2f7; margin: 30px 0;" />

          <p style="font-size: 13px; color: #718096; text-align: center; margin: 0;">
            This email summary was triggered from your self-hosted portainer emergency prep dashboard.<br/>
            Update item statuses directly in the app to clear notifications.
          </p>
        </div>
      </div>
    `;

    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: Number(smtp.port),
      secure: smtp.secure,
      auth: {
        user: smtp.user,
        pass: smtp.pass,
      },
    });

    await transporter.sendMail({
      from: smtp.from || smtp.user,
      to: targetRecipient,
      subject: `[ReadySet] ${totalIssueCount} Items Expired or Removed`,
      html: emailHtml,
    });

    res.json({ success: true, message: `Test Alert Email successfully sent to ${targetRecipient}!` });
  } catch (error: any) {
    console.error("Test SMTP failed", error);
    res.status(500).json({ error: error.message || "Failed to make connection or send test message." });
  }
});

// 4. Create Kit
app.post("/api/kits", (req, res) => {
  const { name, description, category } = req.body;
  if (!name || !category) {
    return res.status(400).json({ error: "Name and category are required" });
  }
  const db = readDB();
  const newKit: Kit = {
    id: "kit_" + Math.random().toString(36).substr(2, 9),
    name,
    description: description || "",
    category,
    items: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  db.kits.push(newKit);
  writeDB(db);
  res.json({ success: true, kit: newKit });
});

// 5. Update Kit (or its items)
app.put("/api/kits/:id", (req, res) => {
  const { id } = req.params;
  const updatedKitPayload = req.body as Partial<Kit>;
  const db = readDB();
  const kitIdx = db.kits.findIndex(k => k.id === id);

  if (kitIdx === -1) {
    return res.status(404).json({ error: "Kit not found" });
  }

  // Preserve core details, merge
  const current = db.kits[kitIdx];
  const updatedKit: Kit = {
    ...current,
    ...updatedKitPayload,
    id: current.id, // prevent ID changing
    updatedAt: new Date().toISOString()
  };

  db.kits[kitIdx] = updatedKit;
  writeDB(db);
  res.json({ success: true, kit: updatedKit });
});

// 6. Delete Kit
app.delete("/api/kits/:id", (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const initialCount = db.kits.length;
  db.kits = db.kits.filter(k => k.id !== id);

  if (db.kits.length === initialCount) {
    return res.status(404).json({ error: "Kit not found" });
  }

  writeDB(db);
  res.json({ success: true, id });
});

// Helper to perform daily or manually triggered alert check
async function performAlertCheck(force: boolean = false) {
  const db = readDB();
  const today = new Date();

  // Format today as YYYY-MM-DD
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  const todayStr = `${year}-${month}-${day}`;

  // If not forced and we already checked today, skip
  if (!force && db.lastAutoCheckDate === todayStr) {
    return {
      success: true,
      skipped: true,
      message: `Automatic alert check already completed today (${todayStr}).`,
      expired: 0,
      expiringSoon: 0,
      reminders: 0
    };
  }

  // Update check date
  db.lastAutoCheckDate = todayStr;
  writeDB(db);

  today.setHours(0, 0, 0, 0);

  const expiredItems: { kitName: string; item: KitItem }[] = [];
  const expiringSoonItems: { kitName: string; item: KitItem }[] = [];
  const pendingReminders: { kitName: string; item: KitItem; daysLeft: number }[] = [];

  // Parse kits for items
  db.kits.forEach(kit => {
    kit.items.forEach(item => {
      // 1. Expiration check
      if (item.expirationDate) {
        const exp = new Date(item.expirationDate);
        if (exp < today) {
          expiredItems.push({ kitName: kit.name, item });
        } else {
          // Check if expiring within 30 days
          const diffTime = Math.abs(exp.getTime() - today.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays <= 30) {
            expiringSoonItems.push({ kitName: kit.name, item });
          }
        }
      }

      // 2. "Removed" Reminders checkout (e.g., car pants)
      if (item.status === 'removed' && item.reminderDueDate) {
        const due = new Date(item.reminderDueDate);
        const diffTime = due.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        pendingReminders.push({ kitName: kit.name, item, daysLeft: diffDays });
      }
    });
  });

  const totalIssueCount = expiredItems.length + expiringSoonItems.length + pendingReminders.length;

  if (totalIssueCount === 0) {
    return {
      success: true,
      message: "Checked prepare status! Everything is fully packed and up to date. No emails triggered because no items are expired, expiring soon, or pending checkout return.",
      expired: 0,
      expiringSoon: 0,
      reminders: 0,
      logs: []
    };
  }

  // Create Email HTML body
  const emailHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 24px; border: 1px solid #e1e8ed; border-radius: 8px; color: #1c1e21; background-color: #fafbfc;">
      <div style="background-color: #dc2626; padding: 20px; border-radius: 6px 6px 0 0; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">ReadySet Alert & Reminders</h1>
      </div>

      <div style="padding: 20px; background-color: #ffffff; border-radius: 0 0 6px 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
        <p style="font-size: 15px; line-height: 1.5; color: #4a5568;">Hi,</p>
        <p style="font-size: 15px; line-height: 1.5; color: #4a5568;">This is your household preparedness digest. We detected <strong>${totalIssueCount} items</strong> requiring checkups or replacements:</p>

        <!-- 1. EXPIRED SECTION -->
        ${expiredItems.length > 0 ? `
          <div style="margin-top: 25px; border-left: 4px solid #dc2626; padding-left: 14px;">
            <h2 style="color: #dc2626; font-size: 17px; margin: 0 0 10px 0; display: flex; align-items: center;">⚠️ Expired Supplies (${expiredItems.length})</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="border-bottom: 2px solid #edf2f7; text-align: left; font-size: 12px; color: #718096; text-transform: uppercase;">
                  <th style="padding: 6px 0;">Item Name</th>
                  <th style="padding: 6px 0;">Kit Location</th>
                  <th style="padding: 6px 0; text-align: right;">Expired On</th>
                </tr>
              </thead>
              <tbody>
                ${expiredItems.map(({ kitName, item }) => `
                  <tr style="border-bottom: 1px solid #f7fafc; font-size: 14px;">
                    <td style="padding: 10px 0; font-weight: 500; color: #2d3748;">
                      ${item.name} <span style="font-size: 12px; font-weight: normal; color: #718096; display: block;">Note: ${item.note || 'None'}</span>
                    </td>
                    <td style="padding: 10px 0; color: #4a5568;">${kitName}</td>
                    <td style="padding: 10px 0; text-align: right; color: #dc2626; font-weight: 600;">${item.expirationDate}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : ''}

        <!-- 2. EXPIRING SOON SECTION -->
        ${expiringSoonItems.length > 0 ? `
          <div style="margin-top: 25px; border-left: 4px solid #d97706; padding-left: 14px;">
            <h2 style="color: #d97706; font-size: 17px; margin: 0 0 10px 0;">⏳ Expiring Soon - within 30 Days (${expiringSoonItems.length})</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="border-bottom: 2px solid #edf2f7; text-align: left; font-size: 12px; color: #718096; text-transform: uppercase;">
                  <th style="padding: 6px 0;">Item Name</th>
                  <th style="padding: 6px 0;">Kit Location</th>
                  <th style="padding: 6px 0; text-align: right;">Expiration</th>
                </tr>
              </thead>
              <tbody>
                ${expiringSoonItems.map(({ kitName, item }) => `
                  <tr style="border-bottom: 1px solid #f7fafc; font-size: 14px;">
                    <td style="padding: 10px 0; font-weight: 500; color: #2d3748;">
                      ${item.name} <span style="font-size: 12px; font-weight: normal; color: #718096; display: block;">Note: ${item.note || 'None'}</span>
                    </td>
                    <td style="padding: 10px 0; color: #4a5568;">${kitName}</td>
                    <td style="padding: 10px 0; text-align: right; color: #d97706; font-weight: 600;">${item.expirationDate}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : ''}

        <!-- 3. REMOVED ITEMS checkout -->
        ${pendingReminders.length > 0 ? `
          <div style="margin-top: 25px; border-left: 4px solid #2563eb; padding-left: 14px;">
            <h2 style="color: #2563eb; font-size: 17px; margin: 0 0 10px 0;">🔄 Out of Kit Reminders (${pendingReminders.length})</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="border-bottom: 2px solid #edf2f7; text-align: left; font-size: 12px; color: #718096; text-transform: uppercase;">
                  <th style="padding: 6px 0;">Borrowed / Removed Item</th>
                  <th style="padding: 6px 0;">Kit Location</th>
                  <th style="padding: 6px 0; text-align: right;">Return Due Date</th>
                </tr>
              </thead>
              <tbody>
                ${pendingReminders.map(({ kitName, item, daysLeft }) => `
                  <tr style="border-bottom: 1px solid #f7fafc; font-size: 14px;">
                    <td style="padding: 10px 0; font-weight: 500; color: #2d3748;">
                      ${item.name} <span style="font-size: 12px; font-weight: normal; display: block; color: #e53e3e;">Status: Removed (${daysLeft <= 0 ? 'Overdue!' : `${daysLeft} days left`})</span>
                      <span style="font-size: 12px; font-weight: normal; color: #718096; display: block;">${item.note || 'None'}</span>
                    </td>
                    <td style="padding: 10px 0; color: #4a5568;">${kitName}</td>
                    <td style="padding: 10px 0; text-align: right; color: #2563eb; font-weight: 600;">${item.reminderDueDate}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : ''}

        <div style="text-align: center; margin: 24px 0 12px 0;">
          <a href="http://server:7123" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 2px 4px rgba(79, 70, 229, 0.2);">Go to app</a>
        </div>

        <hr style="border: 0; border-top: 1px solid #edf2f7; margin: 30px 0;" />

        <p style="font-size: 13px; color: #718096; text-align: center; margin: 0;">
          This email summary was triggered from your self-hosted portainer emergency prep dashboard.<br/>
          Update item statuses directly in the app to clear notifications.
        </p>
      </div>
    </div>
  `;

  const recipients = db.settings.recipientEmails || "fake@gmail.com";
  const subject = `[Prep Alert] ${totalIssueCount} Items Expired or Removed`;

  let alertStatus: 'sent' | 'failed' | 'simulated' = 'simulated';
  let emailErrorMsg: string | undefined = undefined;

  // Let's attempt real SMTP if enabled
  if (db.settings.smtp.enabled && db.settings.smtp.host && db.settings.smtp.user) {
    try {
      const transporter = nodemailer.createTransport({
        host: db.settings.smtp.host,
        port: db.settings.smtp.port,
        secure: db.settings.smtp.secure,
        auth: {
          user: db.settings.smtp.user,
          pass: db.settings.smtp.pass,
        },
      });

      await transporter.sendMail({
        from: db.settings.smtp.from || db.settings.smtp.user,
        to: recipients,
        subject: subject,
        html: emailHtml,
      });

      alertStatus = 'sent';
    } catch (e: any) {
      console.error("Real SMTP failed to send, fallback to simulated", e);
      alertStatus = 'failed';
      emailErrorMsg = e.message || "Failed during SMTP transport";
    }
  }

  // Create Log Entry
  const newLog: EmailLog = {
    id: "log_" + Math.random().toString(36).substr(2, 9),
    timestamp: new Date().toISOString(),
    to: recipients,
    subject: subject,
    body: emailHtml,
    status: alertStatus,
    error: emailErrorMsg
  };

  db.emailLogs.unshift(newLog); // newest first
  writeDB(db);

  return {
    success: alertStatus === 'sent',
    message: alertStatus === 'sent'
      ? `Real alerts dispatched successfully to ${recipients}!`
      : (alertStatus === 'failed'
        ? `Failed sending real SMTP alerts. Fallback log simulated: Check logs.`
        : `Simulated alerts created! (SMTP disabled in preferences - enable in Settings).`),
    expired: expiredItems.length,
    expiringSoon: expiringSoonItems.length,
    reminders: pendingReminders.length,
    logCreated: newLog
  };
}

// 8. Trigger alert checks / Emails
app.post("/api/send-alerts", async (req, res) => {
  try {
    const result = await performAlertCheck(true);
    res.json(result);
  } catch (error: any) {
    console.error("Manual alert check error", error);
    res.status(500).json({ error: error.message || "Failed processing alert check" });
  }
});

// Configure Vite Middlewares Setup or Server bundle path routing
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", async () => {
    console.log(`ReadySet Full-Stack listening on http://0.0.0.0:${PORT}`);

    // Initial check on backend boot
    try {
      console.log("[Auto Check] Executing boot-time daily alert check...");
      const result = await performAlertCheck(false);
      console.log(`[Auto Check] Result: ${JSON.stringify(result)}`);
    } catch (e) {
      console.error("[Auto Check] Failed to execute boot alert check", e);
    }

    // Checking every hour if we entered a new day needing a daily report
    setInterval(async () => {
      try {
        console.log("[Auto Check] Executing routine periodic alert check...");
        const result = await performAlertCheck(false);
        if (!result.skipped) {
          console.log(`[Auto Check] Executed successfully! ${JSON.stringify(result)}`);
        }
      } catch (e) {
        console.error("[Auto Check] Error during periodic alert check", e);
      }
    }, 60 * 60 * 1000); // 1 hour interval
  });
}

startServer();
