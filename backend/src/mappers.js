export function mapCustomer(row) {
  if (!row) return null;
  return {
    id: row.id,
    mobile: row.mobile,
    name: row.name,
    addressLine: row.address_line || '',
    city: row.city || '',
    pincode: row.pincode || '',
  };
}

export function mapService(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    description: row.description,
    price: row.price,
    durationMin: row.duration_min,
    imageUrl: row.image_url,
    active: Boolean(row.active),
  };
}

export function mapProfessional(row) {
  return {
    id: row.id,
    name: row.name,
    skill: row.skill,
    phone: row.phone,
    city: row.city || '',
    rangeKm: row.range_km || 0,
    latitude: row.latitude == null ? null : row.latitude,
    longitude: row.longitude == null ? null : row.longitude,
    active: Boolean(row.active),
  };
}

export function mapBooking(row) {
  return {
    id: row.id,
    customerId: row.customer_id,
    customerName: row.customer_name || undefined,
    customerMobile: row.customer_mobile || undefined,
    serviceId: row.service_id,
    serviceName: row.service_name,
    category: row.category || undefined,
    date: row.scheduled_date,
    time: row.scheduled_time,
    addressLine: row.address_line,
    city: row.city,
    pincode: row.pincode,
    notes: row.notes || '',
    status: row.status,
    professionalId: row.professional_id,
    professionalName: row.professional_name,
    price: row.price,
    paymentMethod: row.payment_method || 'cash',
    paymentStatus: row.payment_status || 'unpaid',
    platformFee: row.platform_fee || 0,
    providerAmount: row.provider_amount || 0,
    distanceKm: row.distance_km == null ? undefined : Math.round(row.distance_km),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapProviderNotification(row) {
  return {
    id: row.id,
    bookingId: row.booking_id,
    title: row.title,
    body: row.body,
    isRead: Boolean(row.is_read),
    pushStatus: row.push_status,
    createdAt: row.created_at,
  };
}

export function mapNotification(row) {
  return {
    id: row.id,
    customerId: row.customer_id,
    customerName: row.customer_name || undefined,
    customerMobile: row.customer_mobile || undefined,
    bookingId: row.booking_id,
    title: row.title,
    body: row.body,
    isRead: Boolean(row.is_read),
    pushStatus: row.push_status,
    createdAt: row.created_at,
  };
}
