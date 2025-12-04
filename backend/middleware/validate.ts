import { Request, Response, NextFunction } from 'express';
import { ZodError, z, ZodTypeAny } from 'zod';

export function validateBody(schema: ZodTypeAny) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req.body);
      (req as any).body = parsed;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: err.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        });
      }
      next(err);
    }
  };
}

const passwordMinLength = 6;
const usernameRegex = /^[a-zA-Z0-9_]+$/;

export const authSchemas = {
  signup: z.object({
    username: z.string().min(3).max(50).regex(usernameRegex),
    email: z.string().email(),
    password: z.string().min(passwordMinLength),
    firstName: z.string().min(1).max(100),
    lastName: z.string().min(1).max(100),
    phoneNumber: z.string().max(30).optional(),
    dateOfBirth: z.string().optional(),
    address: z.any().optional(),
    recaptchaToken: z.string().optional(),
  }),
  verifyEmail: z.object({
    email: z.string().email(),
    code: z.string().min(1),
  }),
  login: z.object({
    email: z.string().email(),
    password: z.string().min(1),
    recaptchaToken: z.string().optional(),
  }),
  forgotPassword: z.object({
    email: z.string().email(),
  }),
  verifyResetCode: z.object({
    email: z.string().email(),
    code: z.string().min(1),
  }),
  resetPassword: z.object({
    email: z.string().email(),
    code: z.string().min(1),
    newPassword: z.string().min(passwordMinLength),
  }),
  googleLogin: z.object({
    idToken: z.string().min(1),
  }),
  promoteToAdmin: z.object({
    email: z.string().email(),
  }),
  setUsername: z.object({
    username: z.string().min(3).max(30).regex(usernameRegex),
  }),
};

const bookingStatusEnum = z.enum(['pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled']);
const paymentStatusEnum = z.enum(['pending', 'paid', 'refunded']);

export const bookingSchemas = {
  createBooking: z.object({
    roomId: z.string().min(1),
    checkInDate: z.string().min(1),
    checkOutDate: z.string().min(1),
    numberOfGuests: z.coerce.number().int().positive(),
    guestName: z.string().min(1).max(200),
    contactNumber: z.string().min(3).max(50),
    specialRequests: z.string().max(1000).optional().nullable(),
  }),
  updateStatus: z.object({
    status: bookingStatusEnum,
    adminNotes: z.string().max(1000).optional().nullable(),
  }),
  requestCancellation: z.object({
    reason: z.string().max(1000).optional().nullable(),
  }),
  declineCancellation: z.object({
    adminNotes: z.string().max(1000).optional().nullable(),
  }),
  checkIn: z.object({
    checkinNotes: z.string().max(1000).optional().nullable(),
    additionalCharges: z.coerce.number().nonnegative().optional(),
  }),
  updatePaymentStatus: z.object({
    paymentStatus: paymentStatusEnum,
  }),
};

const roomTypeEnum = z.enum(['Standard', 'Deluxe', 'Suite', 'Presidential']);

export const roomSchemas = {
  createRoom: z.object({
    roomNumber: z.string().min(1).max(20),
    roomType: roomTypeEnum,
    price: z.coerce.number().positive(),
    capacity: z.coerce.number().int().positive(),
    amenities: z.array(z.string()).optional(),
    description: z.string().max(1000).optional(),
    images: z.array(z.string()).optional(),
  }),
  updateRoom: z.object({
    roomNumber: z.string().min(1).max(20).optional(),
    roomType: roomTypeEnum.optional(),
    price: z.coerce.number().positive().optional(),
    capacity: z.coerce.number().int().positive().optional(),
    amenities: z.array(z.string()).optional(),
    description: z.string().max(1000).optional(),
    images: z.array(z.string()).optional(),
    isAvailable: z.boolean().optional(),
  }),
  updateHousekeepingStatus: z.object({
    housekeepingStatus: z.enum(['clean', 'dirty', 'in-progress']).optional(),
    assignedHousekeeper: z.string().max(100).optional(),
  }),
};

export const roomReviewSchemas = {
  createReview: z.object({
    rating: z.coerce.number().int().min(1).max(5),
    comment: z.string().min(1).max(1000),
  }),
};

export const feedbackSchemas = {
  createFeedback: z.object({
    rating: z.coerce.number().int().min(1).max(5),
    comment: z.string().min(1).max(1000),
  }),
};

export const notificationSchemas = {
  createNotification: z.object({
    type: z.enum(['info', 'success', 'warning', 'error']).optional(),
    message: z.string().min(1).max(500),
    href: z.string().max(300).optional(),
  }),
};
