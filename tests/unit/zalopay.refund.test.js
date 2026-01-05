import { jest } from '@jest/globals';

jest.unstable_mockModule('../../src/service/zalopay.service.js', () => ({
  default: {
    verifyCallback: jest.fn(),
    createPaymentRequest: jest.fn(),
    refundPayment: jest.fn(),
    checkRefundStatus: jest.fn()
  }
}));

jest.unstable_mockModule('../../src/models/order.model.js', () => ({
  default: {
    findOne: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn()
  }
}));

const { default: zaloPayController } = await import('../../src/controllers/zalopay.controller.js');
const { default: ZaloPayService } = await import('../../src/service/zalopay.service.js');
const { default: orderModel } = await import('../../src/models/order.model.js');

describe('ZaloPayController Refund', () => {
  let req, res;

  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    req = {
      body: {
        orderId: 'order123',
        description: 'Customer requested refund'
      }
    };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  it('should return 404 if order not found', async () => {
    orderModel.findById.mockResolvedValue(null);

    await zaloPayController.refund(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Order not found" });
  });

  it('should return 400 if order not paid via zalopay or missing zp_trans_id', async () => {
    orderModel.findById.mockResolvedValue({
        _id: 'order123',
        payment_method: 'cash'
    });

    await zaloPayController.refund(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Order not paid via ZaloPay or missing ZaloPay transaction ID" });
  });

  it('should return 400 if order already refunded', async () => {
    orderModel.findById.mockResolvedValue({
        _id: 'order123',
        payment_method: 'zalopay',
        zp_trans_id: 'zp123',
        payment_status: 'refunded'
    });

    await zaloPayController.refund(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Order already refunded" });
  });

  it('should refund successfully', async () => {
      const mockOrder = {
          _id: 'order123',
          payment_method: 'zalopay',
          zp_trans_id: 'zp123',
          total_price: 50000,
          payment_status: 'paid',
          save: jest.fn().mockResolvedValue(true)
      };
      orderModel.findById.mockResolvedValue(mockOrder);
      
      ZaloPayService.refundPayment.mockResolvedValue({
          return_code: 1,
          m_refund_id: 'refund123'
      });

      await zaloPayController.refund(req, res);

      expect(ZaloPayService.refundPayment).toHaveBeenCalledWith('zp123', 50000, 'Customer requested refund');
      expect(mockOrder.payment_status).toBe('refunded');
      expect(mockOrder.status).toBe('canceled');
      expect(mockOrder.refund_id).toBe('refund123');
      expect(mockOrder.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: { return_code: 1, m_refund_id: 'refund123' } });
  });
  
  it('should return error if ZaloPay refund fails', async () => {
      const mockOrder = {
          _id: 'order123',
          payment_method: 'zalopay',
          zp_trans_id: 'zp123',
          total_price: 50000,
          payment_status: 'paid'
      };
      orderModel.findById.mockResolvedValue(mockOrder);
      
      ZaloPayService.refundPayment.mockResolvedValue({
          return_code: 2,
          return_message: 'Balance not enough'
      });

      await zaloPayController.refund(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Balance not enough', data: { return_code: 2, return_message: 'Balance not enough' } });
  });
});
