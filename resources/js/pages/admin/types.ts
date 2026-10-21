export type AppointmentRow = {
    id: number;
    public_reference: string;
    patient_name: string;
    patient_phone: string;
    patient_email: string | null;
    service_name_snapshot: string;
    duration_minutes_snapshot: number;
    fee_snapshot: number | string | null;
    starts_at: string;
    ends_at: string;
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
};

export type Service = {
    id: number;
    name: string;
    description: string | null;
    duration_minutes: number;
    fee: number | string | null;
    is_active: boolean;
};

export type WeekdayRow = {
    weekday: number;
    is_closed: boolean;
    opens_at: string | null;
    closes_at: string | null;
};

export const weekdays = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
];

export function localDateTime(value: string) {
    // Backend sends clinic-local wall-clock values, never UTC timestamps.
    return value.replace('T', ' ').slice(0, 16);
}

export function statusLabel(value: string) {
    return value === 'no_show'
        ? 'No show'
        : value.charAt(0).toUpperCase() + value.slice(1);
}
