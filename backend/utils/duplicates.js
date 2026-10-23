const Lead = require("../models/LeadModel");
const Customer = require("../models/Customer");

/*
 * Find existing records that share an email or phone number (CRM-F-012).
 *
 * options.leads / options.customers choose which collections to search.
 * options.excludeLeadId / options.excludeCustomerId skip the record that
 * is being edited so it does not match itself.
 *
 * Returns a short, safe summary of each match.
 */
const findDuplicates = async (
  { email, phone },
  {
    leads = false,
    customers = false,
    excludeLeadId = null,
    excludeCustomerId = null,
  } = {}
) => {
  const conditions = [];

  if (email) {
    conditions.push({ email: email.toLowerCase().trim() });
  }

  if (phone && phone.trim()) {
    conditions.push({ phone: phone.trim() });
  }

  if (conditions.length === 0) {
    return [];
  }

  const matches = [];

  if (leads) {
    const query = { $or: conditions };

    if (excludeLeadId) {
      query._id = { $ne: excludeLeadId };
    }

    const found = await Lead.find(query).select(
      "name email phone status"
    );

    found.forEach((record) =>
      matches.push({
        type: "Lead",
        id: record._id,
        name: record.name,
        email: record.email,
        status: record.status,
      })
    );
  }

  if (customers) {
    const query = { $or: conditions };

    if (excludeCustomerId) {
      query._id = { $ne: excludeCustomerId };
    }

    const found = await Customer.find(query).select(
      "name email phone status"
    );

    found.forEach((record) =>
      matches.push({
        type: "Customer",
        id: record._id,
        name: record.name,
        email: record.email,
        status: record.status,
      })
    );
  }

  return matches;
};

module.exports = { findDuplicates };
