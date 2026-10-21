import { useState } from 'react';
import type { FormEvent } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';
import { localDateTime, statusLabel, type AppointmentRow } from './types';

type PageLink = { url: string | null; label: string; active: boolean };
type Props = {
    appointments: {
        data: AppointmentRow[];
        links: PageLink[];
        current_page: number;
        last_page: number;
    };
    filters: { date: string; status: string };
    statuses: string[];
};
const transitions: Record<string, string[]> = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['cancelled', 'completed', 'no_show'],
};

function AppointmentStatus({ appointment }: { appointment: AppointmentRow }) {
    const options = transitions[appointment.status] ?? [];
    const form = useForm({ status: options[0] ?? '' });
    const [message, setMessage] = useState('');
    const updateStatus = (event: FormEvent) => {
        event.preventDefault();
        if (!form.data.status) return;
        if (
            form.data.status === 'cancelled' &&
            !window.confirm(
                'Cancel this appointment? This releases its reserved time.',
            )
        )
            return;
        form.patch(`/admin/appointments/${appointment.id}/status`, {
            preserveScroll: true,
            onSuccess: () => setMessage('Status updated.'),
        });
    };
    if (!options.length)
        return (
            <span className="text-base text-slate-600">No further changes</span>
        );
    return (
        <form
            onSubmit={updateStatus}
            className="flex flex-wrap items-center gap-2"
        >
            <label className="sr-only" htmlFor={`status-${appointment.id}`}>
                New status for {appointment.public_reference}
            </label>
            <select
                id={`status-${appointment.id}`}
                value={form.data.status}
                onChange={(event) => form.setData('status', event.target.value)}
                className="h-11 min-w-36 rounded-md border border-slate-300 bg-white px-3 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
            >
                {options.map((option) => (
                    <option key={option} value={option}>
                        {statusLabel(option)}
                    </option>
                ))}
            </select>
            <Button
                type="submit"
                variant="outline"
                className="h-11"
                disabled={form.processing}
            >
                {form.processing ? 'Saving…' : 'Update'}
            </Button>
            <InputError message={form.errors.status} />
            {message && (
                <span role="status" className="text-base text-teal-900">
                    {message}
                </span>
            )}
        </form>
    );
}

export default function Appointments({
    appointments,
    filters,
    statuses,
}: Props) {
    const [date, setDate] = useState(filters.date ?? '');
    const [status, setStatus] = useState(filters.status ?? '');
    const applyFilters = (event: FormEvent) => {
        event.preventDefault();
        router.get(
            '/admin/appointments',
            { date, status },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };
    const displayedStatuses = statuses.length
        ? statuses
        : ['pending', 'confirmed', 'cancelled', 'completed', 'no_show'];
    return (
        <>
            <Head title="Appointments" />
            <main className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6">
                <header>
                    <p className="text-base font-semibold text-teal-800">
                        Clinic management
                    </p>
                    <h1 className="mt-1 text-3xl font-semibold tracking-tight">
                        Appointments
                    </h1>
                    <p className="mt-2 text-base text-slate-700">
                        Review patient requests and manage appointment status.
                    </p>
                </header>
                <form
                    onSubmit={applyFilters}
                    className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-end"
                >
                    <div className="grid flex-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="filter-date">Date</Label>
                            <Input
                                id="filter-date"
                                type="date"
                                value={date}
                                onChange={(event) =>
                                    setDate(event.target.value)
                                }
                                className="h-11"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="filter-status">Status</Label>
                            <select
                                id="filter-status"
                                value={status}
                                onChange={(event) =>
                                    setStatus(event.target.value)
                                }
                                className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
                            >
                                <option value="">All statuses</option>
                                {displayedStatuses.map((value) => (
                                    <option key={value} value={value}>
                                        {statusLabel(value)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            type="submit"
                            className="h-11 bg-teal-800 hover:bg-teal-900"
                        >
                            Apply filters
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            className="h-11"
                            onClick={() => {
                                setDate('');
                                setStatus('');
                                router.get(
                                    '/admin/appointments',
                                    {},
                                    { preserveScroll: true, replace: true },
                                );
                            }}
                        >
                            Clear
                        </Button>
                    </div>
                </form>
                {appointments.data.length === 0 ? (
                    <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
                        <h2 className="text-lg font-semibold">
                            No appointments found
                        </h2>
                        <p className="mt-2 text-base text-slate-700">
                            Try changing or clearing the filters.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                            <table className="w-full min-w-[950px] border-collapse text-left">
                                <caption className="sr-only">
                                    Appointment records and status actions
                                </caption>
                                <thead className="bg-slate-50 text-base text-slate-700">
                                    <tr>
                                        {[
                                            'Date and time',
                                            'Patient',
                                            'Service',
                                            'Reference',
                                            'Status',
                                            'Action',
                                        ].map((heading) => (
                                            <th
                                                key={heading}
                                                scope="col"
                                                className="px-4 py-3 font-semibold"
                                            >
                                                {heading}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {appointments.data.map((appointment) => (
                                        <tr
                                            key={appointment.id}
                                            className="align-top"
                                        >
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <p className="font-medium">
                                                    {localDateTime(
                                                        appointment.starts_at,
                                                    )}
                                                </p>
                                                <p className="text-base text-slate-700">
                                                    Ends{' '}
                                                    {localDateTime(
                                                        appointment.ends_at,
                                                    )}
                                                </p>
                                            </td>
                                            <td className="px-4 py-4">
                                                <p className="font-semibold">
                                                    {appointment.patient_name}
                                                </p>
                                                <a
                                                    className="block text-teal-900 underline underline-offset-2"
                                                    href={`tel:${appointment.patient_phone}`}
                                                >
                                                    {appointment.patient_phone}
                                                </a>
                                                {appointment.patient_email && (
                                                    <a
                                                        className="block break-all text-teal-900 underline underline-offset-2"
                                                        href={`mailto:${appointment.patient_email}`}
                                                    >
                                                        {
                                                            appointment.patient_email
                                                        }
                                                    </a>
                                                )}
                                            </td>
                                            <td className="px-4 py-4">
                                                <p className="font-medium">
                                                    {
                                                        appointment.service_name_snapshot
                                                    }
                                                </p>
                                                <p className="text-base text-slate-700">
                                                    {
                                                        appointment.duration_minutes_snapshot
                                                    }{' '}
                                                    minutes
                                                </p>
                                            </td>
                                            <td className="px-4 py-4 font-mono text-base">
                                                {appointment.public_reference}
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className="inline-flex rounded-full border border-slate-300 px-3 py-1 text-base font-medium">
                                                    {statusLabel(
                                                        appointment.status,
                                                    )}
                                                </span>
                                            </td>
                                            <td className="min-w-60 px-4 py-4">
                                                <AppointmentStatus
                                                    appointment={appointment}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <nav
                            aria-label="Appointment pages"
                            className="flex flex-wrap items-center justify-between gap-3"
                        >
                            <p className="text-base text-slate-700">
                                Page {appointments.current_page} of{' '}
                                {appointments.last_page}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {appointments.links.map((link, index) =>
                                    link.url ? (
                                        <Link
                                            key={`${link.label}-${index}`}
                                            href={link.url}
                                            preserveScroll
                                            className={`inline-flex min-h-11 items-center rounded-md border px-3 text-base ${link.active ? 'border-teal-800 bg-teal-800 text-white' : 'border-slate-300 bg-white hover:bg-slate-50'}`}
                                            aria-current={
                                                link.active ? 'page' : undefined
                                            }
                                        >
                                            {link.label
                                                .replace(
                                                    '&laquo; Previous',
                                                    'Previous',
                                                )
                                                .replace('Next &raquo;', 'Next')
                                                .replace('&hellip;', '…')}
                                        </Link>
                                    ) : (
                                        <span
                                            key={`${link.label}-${index}`}
                                            className="inline-flex min-h-11 items-center rounded-md border border-slate-200 px-3 text-base text-slate-500"
                                        >
                                            {link.label
                                                .replace(
                                                    '&laquo; Previous',
                                                    'Previous',
                                                )
                                                .replace(
                                                    'Next &raquo;',
                                                    'Next',
                                                )}
                                        </span>
                                    ),
                                )}
                            </div>
                        </nav>
                    </>
                )}
            </main>
        </>
    );
}
