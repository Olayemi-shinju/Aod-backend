import Contact from '../models/contactmodel.js'

export const createContact = async (req, res) => {
  try {
    const { name, phone, email, subject, message } = req.body;

    const userId = req.user._id;

    if (!userId) {
      return res.status(404).json({ success: false, msg: 'User not authenticated. Please log in.' });
    }

    const data = new Contact({
      name,
      phone,
      email,
      subject,
      message,
      user: userId,
    });

    await data.save();

    res.status(200).json({ success: true, msg: 'Your message has been sent successfully. We will get back to you soon!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, msg: 'Oops! Something went wrong on our end. Please try again later.' });
  }
};


export const getAllContact = async(req, res)=>{
  try {
    const resp = await Contact.find().populate('user')
    res.status(200).json({success: true, msg: 'Users contacts history retrieved successfully', data: resp})
  } catch (error) {
    console.log(error)
    res.status(500).json({success: false, msg: 'An error ocurred while fetching users contact history'})
  }
}

export const deleteAllContact = async (req, res) => {
  try {
    // Delete all documents in Contact collection
    const result = await Contact.deleteMany({});

    const resp = await Contact.find().populate('user')
    res.status(200).json({
      success: true,
      msg: `All contacts deleted successfully. Deleted count: ${result.deletedCount}`,
      data: resp
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, msg: 'Failed to delete contacts.' });
  }
};

export const deleteContactById = async (req, res) => {
  try {
    const contactId = req.params.id;

    const deletedContact = await Contact.findByIdAndDelete(contactId);

    if (!deletedContact) {
      return res.status(404).json({ success: false, msg: 'Contact not found' });
    }

    const resp = await Contact.find().populate('user')

    res.status(200).json({ success: true, msg: 'Contact deleted successfully', data: resp });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, msg: 'Failed to delete contact' });
  }
};


// MARK CONTACT MESSAGE AS READ
export const markContactAsRead = async (req, res) => {
  try {
    const contactId = req.params.id;

    const contact = await Contact.findById(contactId);

    if (!contact) {
      return res.status(404).json({ success: false, msg: 'Contact message not found' });
    }

    if (contact.isRead) {
      return res.status(400).json({ success: false, msg: 'Contact message is already marked as read' });
    }

    contact.isRead = true;
    await contact.save();

    res.status(200).json({
      success: true,
      msg: 'Contact message marked as read',
      data: contact,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      msg: 'An error occurred while marking the contact message as read',
    });
  }
};



export const updateContactById = async (req, res) => {
  try {
    const contactId = req.params.id;
    const updateData = req.body;

    const updatedContact = await Contact.findByIdAndUpdate(contactId, updateData, { new: true });

    if (!updatedContact) {
      return res.status(404).json({ success: false, msg: 'Contact not found' });
    }

    res.status(200).json({ success: true, msg: 'Contact updated successfully', data: updatedContact });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, msg: 'Failed to update contact' });
  }
};


// Get unread contact messages count
export const getUnreadContactsCount = async (req, res) => {
  try {
    const count = await Contact.countDocuments({ isRead: false });
    res.status(200).json({ success: true, count });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, msg: 'Failed to fetch unread contact messages count' });
  }
};

// Mark all contact messages as read
export const markAllContactsAsRead = async (req, res) => {
  try {
    const result = await Contact.updateMany({ isRead: false }, { isRead: true });
    res.status(200).json({ success: true, msg: `Marked ${result.modifiedCount} contacts as read` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, msg: 'Failed to mark contact messages as read' });
  }
};
