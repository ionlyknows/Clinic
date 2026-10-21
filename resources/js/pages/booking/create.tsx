import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, LoaderCircle } from 'lucide-react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Service = {
    id: number;
    name: string;
    description?: string | null;
    duration_minutes: number;
    fee?: number | string | null;
};
type Props = { services: Service[]; bookingConfigured: boolean };
type FormData = {
    service_id: string;
    date: string;
    time: string;
    patient_name: string;
    patient_phone: string;
    patient_email: string;
};
const today = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

export default function CreateBooking({ services, bookingConfigured }: Props) {
    const form = useForm<FormData>({
        service_id: '',
        date: '',
        time: '',
        patient_name: '',
        patient_phone: '',
        patient_email: '',
    });
    const [slots, setSlots] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [availabilityError, setAvailabilityError] = useState('');
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        setSlots([]);
        setLoaded(false);
        setAvailabilityError('');
        form.setData('time', '');
        if (!form.data.service_id || !form.data.date || !bookingConfigured)
            return;
        const controller = new AbortController();
        setLoading(true);
        fetch(
            `/booking/availability?service_id=${encodeURIComponent(form.data.service_id)}&date=${encodeURIComponent(form.data.date)}`,
            {
                headers: { Accept: 'application/json' },
                signal: controller.signal,
            },
        )
            .then(async (response) => {
                if (!response.ok)
                    throw new Error(
                        'We could not load available times. Please try again.',
                    );
                return response.json() as Promise<{ slots?: unknown }>;
            })
            .then((body) => {
                if (
                    !Array.isArray(body.slots) ||
                    !body.slots.every((slot) => typeof slot === 'string')
                )
                    throw new Error(
                        'We could not load available times. Please try again.',
                    );
                setSlots(body.slots);
                setLoaded(true);
            })
            .catch((error: unknown) => {
                if (error instanceof Error && error.name !== 'AbortError')
                    setAvailabilityError(error.message);
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });
        return () => controller.abort();
        // form.setData is stable in Inertia; avoid depending on the full form object.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.data.service_id, form.data.date, bookingConfigured]);

    useEffect(() => {
        if (form.errors.time && form.data.time) form.setData('time', '');
    }, [form.errors.time, form.data.time, form.setData]);

    const fieldError = (name: keyof FormData) => form.errors[name];
    const generalError = Object.values(form.errors).find(
        (value): value is string => typeof value === 'string',
    );
    const describe = (name: keyof FormData) =>
        fieldError(name) ? `${name}-error` : undefined;
    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        form.post('/appointments', { preserveScroll: true });
    };

    return (
        <>
            <Head title="Book an appointment" />
            <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 sm:py-12">
                <div className="mx-auto max-w-3xl">
                    <Link
                        href="/"
                        className="inline-flex min-h-11 items-center gap-2 rounded text-base font-medium text-teal-900 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
                    >
                        <ArrowLeft size={18} aria-hidden="true" /> Back to
                        clinic
                    </Link>
                    <header className="mt-7">
                        <p className="font-semibold text-teal-800">
                            Appointment request
                        </p>
                        <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
                            Book a visit
                        </h1>
                        <p className="mt-3 text-base leading-7 text-slate-700">
                            Choose a service and available time, then share your
                            contact details. The clinic will confirm your
                            request.
                        </p>
                    </header>
                    {!bookingConfigured && (
                        <p
                            role="status"
                            className="mt-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-base text-amber-950"
                        >
                            Online booking is not available yet because the
                            clinic has not configured its opening hours.
                        </p>
                    )}
                    {services.length === 0 && (
                        <p
                            role="status"
                            className="mt-6 rounded-lg border border-slate-300 bg-white p-4 text-base text-slate-800"
                        >
                            There are no services available for online booking
                            yet. Please contact the clinic.
                        </p>
                    )}
                    <form
                        onSubmit={submit}
                        className="mt-7 space-y-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8"
                    >
                        <section
                            aria-labelledby="visit-heading"
                            className="space-y-5"
                        >
                            <h2
                                id="visit-heading"
                                className="text-xl font-semibold"
                            >
                                Choose your visit
                            </h2>
                            <div className="grid gap-5 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="service_id">Service</Label>
                                    <select
                                        id="service_id"
                                        name="service_id"
                                        value={form.data.service_id}
                                        onChange={(event) =>
                                            form.setData(
                                                'service_id',
                                                event.target.value,
                                            )
                                        }
                                        aria-invalid={
                                            !!fieldError('service_id')
                                        }
                                        aria-describedby={describe(
                                            'service_id',
                                        )}
                                        disabled={
                                            !bookingConfigured ||
                                            services.length === 0
                                        }
                                        required
                                        className="h-12 w-full rounded-md border border-input bg-white px-3 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:opacity-60"
                                    >
                                        <option value="">
                                            Select a service
                                        </option>
                                        {services.map((service) => (
                                            <option
                                                key={service.id}
                                                value={service.id}
                                            >
                                                {service.name} ·{' '}
                                                {service.duration_minutes} min
                                            </option>
                                        ))}
                                    </select>
                                    <InputError
                                        id="service_id-error"
                                        message={fieldError('service_id')}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="date">Preferred date</Label>
                                    <Input
                                        id="date"
                                        name="date"
                                        type="date"
                                        min={today()}
                                        value={form.data.date}
                                        onChange={(event) =>
                                            form.setData(
                                                'date',
                                                event.target.value,
                                            )
                                        }
                                        aria-invalid={!!fieldError('date')}
                                        aria-describedby={describe('date')}
                                        disabled={!bookingConfigured}
                                        required
                                        className="h-12"
                                    />
                                    <InputError
                                        id="date-error"
                                        message={fieldError('date')}
                                    />
                                </div>
                            </div>
                            <fieldset
                                disabled={
                                    !form.data.service_id ||
                                    !form.data.date ||
                                    loading ||
                                    !bookingConfigured
                                }
                                aria-describedby={
                                    fieldError('time')
                                        ? 'time-error'
                                        : undefined
                                }
                                className="space-y-3"
                            >
                                <legend className="text-base font-medium">
                                    Available start time
                                </legend>
                                <p
                                    className="text-base text-slate-700"
                                    aria-live="polite"
                                >
                                    {loading
                                        ? 'Loading available times…'
                                        : availabilityError ||
                                          (loaded && slots.length === 0
                                              ? 'No available times on this date. Try another date or service.'
                                              : !form.data.service_id ||
                                                  !form.data.date
                                                ? 'Choose a service and date to see available times.'
                                                : 'Choose one of the available times.')}
                                </p>
                                {availabilityError && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const date = form.data.date;
                                            form.setData('date', '');
                                            window.setTimeout(
                                                () =>
                                                    form.setData('date', date),
                                                0,
                                            );
                                        }}
                                        className="text-base font-semibold text-teal-900 underline underline-offset-2"
                                    >
                                        Try again
                                    </button>
                                )}
                                {slots.length > 0 && (
                                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                        {slots.map((slot) => (
                                            <label
                                                key={slot}
                                                className={`flex min-h-12 cursor-pointer items-center justify-center rounded-lg border px-3 text-base font-medium focus-within:ring-2 focus-within:ring-teal-700 ${form.data.time === slot ? 'border-teal-800 bg-teal-50 text-teal-950' : 'border-slate-300 hover:bg-slate-50'}`}
                                            >
                                                <input
                                                    className="sr-only"
                                                    type="radio"
                                                    name="time"
                                                    value={slot}
                                                    checked={
                                                        form.data.time === slot
                                                    }
                                                    onChange={() =>
                                                        form.setData(
                                                            'time',
                                                            slot,
                                                        )
                                                    }
                                                    aria-label={`Start at ${slot}`}
                                                />
                                                {slot}
                                            </label>
                                        ))}
                                    </div>
                                )}
                                <InputError
                                    id="time-error"
                                    message={fieldError('time')}
                                />
                            </fieldset>
                        </section>
                        <section
                            aria-labelledby="details-heading"
                            className="space-y-5 border-t border-slate-200 pt-6"
                        >
                            <div>
                                <h2
                                    id="details-heading"
                                    className="text-xl font-semibold"
                                >
                                    Your contact details
                                </h2>
                                <p className="mt-1 text-base text-slate-700">
                                    We use these details to manage your
                                    appointment request. Do not include health
                                    information.
                                </p>
                            </div>
                            <div className="grid gap-5 sm:grid-cols-2">
                                <div className="space-y-2 sm:col-span-2">
                                    <Label htmlFor="patient_name">
                                        Full name
                                    </Label>
                                    <Input
                                        id="patient_name"
                                        name="patient_name"
                                        autoComplete="name"
                                        required
                                        maxLength={160}
                                        value={form.data.patient_name}
                                        onChange={(event) =>
                                            form.setData(
                                                'patient_name',
                                                event.target.value,
                                            )
                                        }
                                        aria-invalid={
                                            !!fieldError('patient_name')
                                        }
                                        aria-describedby={describe(
                                            'patient_name',
                                        )}
                                        className="h-12"
                                    />
                                    <InputError
                                        id="patient_name-error"
                                        message={fieldError('patient_name')}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="patient_phone">
                                        Phone number
                                    </Label>
                                    <Input
                                        id="patient_phone"
                                        name="patient_phone"
                                        type="tel"
                                        autoComplete="tel"
                                        required
                                        maxLength={40}
                                        value={form.data.patient_phone}
                                        onChange={(event) =>
                                            form.setData(
                                                'patient_phone',
                                                event.target.value,
                                            )
                                        }
                                        aria-invalid={
                                            !!fieldError('patient_phone')
                                        }
                                        aria-describedby={describe(
                                            'patient_phone',
                                        )}
                                        className="h-12"
                                    />
                                    <InputError
                                        id="patient_phone-error"
                                        message={fieldError('patient_phone')}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="patient_email">
                                        Email{' '}
                                        <span className="font-normal text-slate-600">
                                            (optional)
                                        </span>
                                    </Label>
                                    <Input
                                        id="patient_email"
                                        name="patient_email"
                                        type="email"
                                        autoComplete="email"
                                        maxLength={254}
                                        value={form.data.patient_email}
                                        onChange={(event) =>
                                            form.setData(
                                                'patient_email',
                                                event.target.value,
                                            )
                                        }
                                        aria-invalid={
                                            !!fieldError('patient_email')
                                        }
                                        aria-describedby={describe(
                                            'patient_email',
                                        )}
                                        className="h-12"
                                    />
                                    <InputError
                                        id="patient_email-error"
                                        message={fieldError('patient_email')}
                                    />
                                </div>
                            </div>
                        </section>
                        {generalError && (
                            <p
                                role="alert"
                                className="rounded-lg border border-red-300 bg-red-50 p-4 text-base text-red-900"
                            >
                                {generalError}
                            </p>
                        )}
                        <div className="border-t border-slate-200 pt-6">
                            <Button
                                type="submit"
                                disabled={
                                    form.processing ||
                                    !bookingConfigured ||
                                    services.length === 0 ||
                                    !form.data.time
                                }
                                className="h-12 w-full bg-teal-800 text-base hover:bg-teal-900 sm:w-auto sm:px-8"
                            >
                                {form.processing && (
                                    <LoaderCircle
                                        className="motion-safe:animate-spin"
                                        aria-hidden="true"
                                    />
                                )}
                                {form.processing
                                    ? 'Sending request…'
                                    : 'Request appointment'}
                            </Button>
                            <p className="mt-3 text-base text-slate-700">
                                Your appointment is pending until the clinic
                                confirms it.
                            </p>
                        </div>
                    </form>
                </div>
            </main>
        </>
    );
}
