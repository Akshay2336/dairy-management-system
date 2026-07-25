const Customer = require("../models/Customer");


// Add Customer
const addCustomer = async (req, res) => {
  try {
    const { name, phone, address, milkType } = req.body;

    // Validation
    if (!name || !phone || !milkType) {
      return res.status(400).json({
        message: "Please fill all required fields",
      });
    }

    // Create customer
    const customer = await Customer.create({
      userId: req.user._id,
      name,
      phone,
      address,
      milkType,
    });

    res.status(201).json({
      message: "Customer Added Successfully",
      customer,
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};


// Get All Customers
const getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find({
      userId: req.user._id,
    }).sort({ createdAt: -1 });

    res.status(200).json(customers);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};


// Get Single Customer
const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    res.status(200).json(customer);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

// Update Customer
const updateCustomer = async (req, res) => {
  try {
    const { name, phone, address, milkType, status } = req.body;

    const customer = await Customer.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    customer.name = name || customer.name;
    customer.phone = phone || customer.phone;
    customer.address = address || customer.address;
    customer.milkType = milkType || customer.milkType;
    customer.status = status || customer.status;

    await customer.save();

    res.status(200).json({
      message: "Customer Updated Successfully",
      customer,
    });

  } catch (error) {
  console.error(error);

  res.status(500).json({
    message: error.message,
    error,
  });
}
};

// Delete Customer
const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    await customer.deleteOne();

    res.status(200).json({
      message: "Customer Deleted Successfully",
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

module.exports = {
  addCustomer,getCustomers,getCustomerById,updateCustomer,deleteCustomer ,
};