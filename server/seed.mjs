// Seed client records — mirrors the frontend seed in
// src/app/stores/clientsStore.ts so the DB starts with the same demo data.
const mk = (s) => {
  const base = {
    id: s.id, customerId: s.id, initials: s.initials, avatarColor: s.avatarColor, name: s.name,
    title: "", firstName: s.firstName, middleInitial: "", lastName: s.lastName, preferredName: "",
    company: "", role: "Property Owner", customerType: "homeowner", type: "Residential",
    status: "Active", customerSince: "Jan 1, 2023", lastActivity: "", lastService: "",
    mobilePhone: s.mobilePhone, mobilePhoneExt: "", workPhone: "", workPhoneExt: "",
    phone: s.mobilePhone, email: s.email, website: "",
    address: s.address, unit: "", city: s.city, state: s.state, zip: s.zip,
    country: "United States", county: "",
    isBillingSameAsService: true, billingAddress: s.address, billingUnit: "", billingCity: s.city,
    billingState: s.state, billingZip: s.zip, billingCounty: "", gateCode: "",
    isTaxable: true, paymentTerms: "Net 30", paymentMethod: "Card", creditLimit: 5000,
    totalJobs: 0, openJobs: 0, totalRevenue: 0, estimatesTotal: 0, openBalance: 0,
    pastDueBalance: 0, balance: 0, totalBilled: 0, pastDue: 0, daysOverdue: 0,
    department: "", salesRep: "", accManager: "", marketingSource: "",
    membership: "", membershipExpiry: "", notes: "", notesArray: [], additionalContacts: [],
    serviceAddresses: [{
      id: "1", street: s.address, unit: s.unit ?? "", city: s.city, state: s.state, zip: s.zip,
      county: s.county ?? "", notes: s.gateCode ? `Gate code: ${s.gateCode}` : "", isPrimary: true,
    }],
    customFields: {},
    tags: [],
  };
  return { ...base, ...s, customerId: s.customerId ?? s.id, phone: s.phone ?? s.mobilePhone };
};

export const seedClients = [
  mk({
    id: "10245", initials: "JS", avatarColor: "#4A6FA5", name: "John Smith", firstName: "John", lastName: "Smith",
    role: "Property Owner", email: "john.smith@email.com", mobilePhone: "(555) 123-4567",
    address: "123 Main St", city: "Austin", state: "TX", zip: "78701", county: "Travis",
    tags: ["Residential", "VIP"], status: "Active", customerSince: "Apr 12, 2022", lastActivity: "Invoice Sent • 2 days ago",
    totalJobs: 5, openJobs: 2, totalRevenue: 12450, totalBilled: 12450, estimatesTotal: 3400, openBalance: 1200, balance: 1200,
    gateCode: "1145",
    notesArray: [
      { id: 1, text: "Prefers morning appointments.", date: "Mar 10, 2026" },
      { id: 2, text: "Large back yard — bring extra hose.", date: "Feb 2, 2026" },
    ],
    additionalContacts: [
      { id: 1, firstName: "Jane", lastName: "Smith", phone: "(555) 123-0000", email: "jane.smith@email.com", relationship: "Spouse" },
    ],
  }),
  mk({
    id: "10246", initials: "SJ", avatarColor: "#3B82F6", name: "Sarah Johnson", firstName: "Sarah", lastName: "Johnson",
    company: "Johnson & Partners", role: "Operations Manager", type: "Commercial", customerType: "business",
    email: "sarah.j@email.com", mobilePhone: "(555) 234-5678", website: "https://johnsonpartners.com",
    address: "456 Oak Ave", city: "Dallas", state: "TX", zip: "75201", county: "Dallas",
    tags: ["Commercial"], status: "Active", customerSince: "Sep 3, 2023", lastActivity: "Estimate Sent • 5 days ago",
    totalJobs: 0, openJobs: 0, totalRevenue: 0, estimatesTotal: 1800,
  }),
  mk({
    id: "10247", initials: "MD", avatarColor: "#8B5CF6", name: "Mike Davis", firstName: "Mike", lastName: "Davis",
    company: "Davis Construction", role: "Owner", type: "Commercial", customerType: "business",
    email: "mike@davis.com", mobilePhone: "(555) 345-6789", website: "https://davisconstruction.com",
    address: "789 Pine Rd", city: "Houston", state: "TX", zip: "77001", county: "Harris",
    tags: ["Residential", "Repeat"], status: "Inactive", customerSince: "Jun 18, 2021", lastActivity: "Invoice Overdue • 18 days",
    totalJobs: 3, openJobs: 1, totalRevenue: 8750.5, totalBilled: 8750.5, openBalance: 1250, pastDueBalance: 1250, balance: 1250, pastDue: 1250, daysOverdue: 18,
    gateCode: "0042",
    notesArray: [{ id: 1, text: "Net 30 terms agreed.", date: "Jan 15, 2026" }],
  }),
  mk({
    id: "10248", initials: "RL", avatarColor: "#D97706", name: "Robert Lee", firstName: "Robert", lastName: "Lee",
    company: "Lee & Associates", role: "Principal", type: "Commercial", customerType: "business",
    email: "robert.l@email.com", mobilePhone: "(555) 456-7890",
    address: "321 Elm St", city: "San Antonio", state: "TX", zip: "78201", county: "Bexar",
    tags: ["Commercial", "New"], status: "Prospect", customerSince: "Apr 2, 2026", lastActivity: "Contacted • 3 days ago",
    totalJobs: 0, openJobs: 0, totalRevenue: 0,
  }),
  mk({
    id: "10249", initials: "EP", avatarColor: "#10B981", name: "Emily Parker", firstName: "Emily", lastName: "Parker",
    role: "Homeowner", email: "e.parker@email.com", mobilePhone: "(555) 567-8901",
    address: "654 Maple Dr", city: "Fort Worth", state: "TX", zip: "76101", county: "Tarrant",
    tags: ["Residential"], status: "Active", customerSince: "Nov 20, 2024", lastActivity: "Payment Received • 4 days ago",
    totalJobs: 2, openJobs: 1, totalRevenue: 5320, totalBilled: 5320,
    notesArray: [{ id: 1, text: "Gate code changes monthly — call ahead.", date: "Mar 1, 2026" }],
  }),
  mk({
    id: "10250", initials: "TC", avatarColor: "#DC2626", name: "Tom Carter", firstName: "Tom", lastName: "Carter",
    company: "Carter Facilities", role: "Facilities Lead", type: "Commercial", customerType: "business",
    email: "tom.c@email.com", mobilePhone: "(555) 678-9012",
    address: "987 Cedar Ln", city: "Plano", state: "TX", zip: "75023", county: "Collin",
    tags: ["Commercial", "Priority"], status: "Prospect", customerSince: "May 30, 2026", lastActivity: "Quote Requested • today",
    totalJobs: 0, openJobs: 0, totalRevenue: 0,
  }),
];
