const { validationResult } = require('express-validator');
const Order = require('../Models/order');
const generateOrderId = require('../utils/generateOrderId');
const Student = require('../Models/student'); // added to fetch email for first-year detection

exports.getAllOrders = async (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Forbidden' });
  try {
    const orders = await Order.find().populate('studentId').populate('items.item');
    res.json({ success: true, data: orders });
  } catch (err) {
    next(err);
  }
};

exports.getMyOrders = async (req, res, next) => {
  if (req.user.role !== 'student') return res.status(403).json({ success: false, message: 'Forbidden' });
  try {
    const orders = await Order.find({ studentId: req.user.id }).populate('items.item');
    res.json({ success: true, data: orders });
  } catch (err) {
    next(err);
  }
};

exports.placeOrder = async (req, res, next) => {
  if (req.user.role !== 'student') return res.status(403).json({ success: false, message: 'Forbidden' });
  try {
    // Parse items from FormData or JSON
    let items = req.body.items;
    if (typeof items === 'string') {
      items = JSON.parse(items);
    }
    // Support either uploaded file (multer) or direct URL from client
    let paymentScreenshotUrl = undefined;
    if (req.file && req.file.path) {
      paymentScreenshotUrl = req.file.path;
    } else if (req.body.paymentScreenshot && typeof req.body.paymentScreenshot === 'string') {
      paymentScreenshotUrl = req.body.paymentScreenshot; // already a URL
    }

    // Determine if first year & build hostelTag (defensive revalidation)
    let hostelTag = null;
    try {
      const studentDoc = await Student.findById(req.user.id).select('email');
      const studentEmail = studentDoc ? String(studentDoc.email).toLowerCase() : (req.body.email || '').toLowerCase();
      const emailYearPrefix = studentEmail.substring(0, 2);
      const currentYearYY = String(new Date().getFullYear() % 100).padStart(2, '0');
      const claimedFirstYear = req.body.firstYear === 'true' || req.body.firstYear === true;
      const hostelChoice = (req.body.hostelChoice || '').toLowerCase(); // 'boys' | 'girls'
      const validHostel = hostelChoice === 'boys' || hostelChoice === 'girls';
      if (emailYearPrefix === currentYearYY && claimedFirstYear && validHostel) {
        hostelTag = `First Year – ${hostelChoice === 'boys' ? 'Boys Hostel' : 'Girls Hostel'}`;
      }
    } catch (_) {
      hostelTag = null;
    }

    // Generate a unique 4-character orderId
    let orderId;
    let isUnique = false;
    while (!isUnique) {
      orderId = generateOrderId();
      const existing = await Order.findOne({ orderId });
      if (!existing) isUnique = true;
    }

    const order = new Order({
      studentId: req.user.id,
      items: items.map(i => ({ item: i.item, quantity: i.quantity })),
      rollNo: req.body.rollNo,
      paymentScreenshot: paymentScreenshotUrl,
      status: 'pending',
      orderId,
      hostelTag
    });
    await order.save();

    // Populate for real-time updates
    const populatedOrder = await Order.findById(order._id)
      .populate('studentId')
      .populate('items.item');

    // Emit socket.io event for new order
    const io = req.app.get('io');
    if (io) io.emit('newOrder', populatedOrder);
    res.json({ success: true, message: 'Order placed', data: populatedOrder });
  } catch (err) {
    next(err);
  }
};

exports.updateOrderStatus = async (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Forbidden' });
  try {
    let order = null;
    // Try to find by MongoDB _id first
    if (/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
      order = await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    }
    // If not found, try by orderId (4-char string)
    if (!order) {
      order = await Order.findOneAndUpdate({ orderId: req.params.id }, { status: req.body.status }, { new: true });
    }
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    // Emit targeted socket.io event to student
    const io = req.app.get('io');
    const userSocketMap = req.app.get('userSocketMap');
    if (order && io && userSocketMap) {
      const studentId = order.studentId ? order.studentId.toString() : undefined;
      if (studentId) {
        const socketId = userSocketMap[studentId];
        if (socketId) {
          if (order.status === 'rejected') {
            io.to(socketId).emit('orderRejected', {
              orderId: order.orderId,
              message: "Your order has been rejected due to submission of a fake or unclear payment screenshot. If this was not intentional or was submitted by mistake, please visit the night canteen and present the actual payment proof. Kindly ensure this is not repeated in the future."
            });
          } else {
            io.to(socketId).emit('orderStatusUpdated', {
              orderId: order.orderId,
              status: order.status
            });
          }
        }
      }
    }
    res.json({ success: true, message: 'Order status updated', data: order });
  } catch (err) {
    next(err);
  }
};
