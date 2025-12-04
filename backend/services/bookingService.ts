export interface BookingPricingInput {
  roomPrice: number;
  capacity: number;
  checkInDate: Date;
  checkOutDate: Date;
  numberOfGuests: number;
}

export interface BookingPricingResult {
  nights: number;
  baseAmount: number;
  extraPersons: number;
  extraPersonCharge: number;
  totalAmount: number;
}

export function calculateBookingPricing(input: BookingPricingInput): BookingPricingResult {
  const { roomPrice, capacity, checkInDate, checkOutDate, numberOfGuests } = input;

  const msPerNight = 1000 * 60 * 60 * 24;
  const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / msPerNight);

  const baseAmount = roomPrice * nights;
  const extraPersons = Math.max(0, numberOfGuests - capacity);
  const extraPersonCharge = extraPersons * 300 * nights;
  const totalAmount = baseAmount + extraPersonCharge;

  return {
    nights,
    baseAmount,
    extraPersons,
    extraPersonCharge,
    totalAmount,
  };
}
