import { Head, Link } from '@inertiajs/react';
import { CalendarDays, ClipboardList, Clock3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { localDateTime, statusLabel, type AppointmentRow } from './types';

type Props = {
    counts: { today: number; pending: number; confirmed: number };
    upcoming: AppointmentRow[];
};
const countCards = [
    { key: 'today', label: "Today's appointments", icon: CalendarDays },
    { key: 'pending', label: 'Pending requests', icon: Clock3 },
    { key: 'confirmed', label: 'Confirmed appointments', icon: ClipboardList },
] as const;

export default function AdminDashboard({ counts, upcoming }: Props) {
    return (
        <>
            <Head title="Clinic dashboard" />
            <main className="mx-auto w-full max-w-7xl space-y-7 p-4 sm:p-6">
                <header>
                    <p className="text-base font-semibold text-teal-800">
                        Clinic management
                    </p>
                    <h1 className="mt-1 text-3xl font-semibold tracking-tight">
                        Dashboard
                    </h1>
                    <p className="mt-2 text-base text-slate-700">
                        A quick view of today's schedule and requests.
                    </p>
                </header>
                <section
                    aria-label="Appointment counts"
                    className="grid gap-4 sm:grid-cols-3"
                >
                    {countCards.map(({ key, label, icon: Icon }) => (
                        <Card key={key} className="gap-3 py-5">
                            <CardHeader className="flex-row items-center justify-between">
                                <CardTitle className="text-base font-medium text-slate-700">
                                    {label}
                                </CardTitle>
                                <Icon
                                    size={20}
                                    className="text-teal-800"
                                    aria-hidden="true"
                                />
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-semibold tabular-nums">
                                    {counts[key]}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </section>
                <section
                    aria-labelledby="upcoming-title"
                    className="rounded-xl border border-slate-200 bg-white"
                >
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
                        <div>
                            <h2
                                id="upcoming-title"
                                className="text-xl font-semibold"
                            >
                                Upcoming appointments
                            </h2>
                            <p className="mt-1 text-base text-slate-700">
                                Active requests and confirmed visits.
                            </p>
                        </div>
                        <Link
                            href="/admin/appointments"
                            className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-4 font-medium hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
                        >
                            View all appointments
                        </Link>
                    </div>
                    {upcoming.length === 0 ? (
                        <p className="p-6 text-base text-slate-700">
                            There are no upcoming appointments.
                        </p>
                    ) : (
                        <div className="divide-y divide-slate-200">
                            {upcoming.map((appointment) => (
                                <article
                                    key={appointment.id}
                                    className="grid gap-2 px-5 py-4 sm:grid-cols-[12rem_1fr_auto] sm:items-center"
                                >
                                    <div>
                                        <p className="font-semibold">
                                            {localDateTime(
                                                appointment.starts_at,
                                            )}
                                        </p>
                                        <p className="text-base text-slate-700">
                                            {
                                                appointment.duration_minutes_snapshot
                                            }{' '}
                                            minutes
                                        </p>
                                    </div>
                                    <div>
                                        <p className="font-medium">
                                            {appointment.patient_name}
                                        </p>
                                        <p className="text-base text-slate-700">
                                            {appointment.service_name_snapshot}{' '}
                                            · {appointment.patient_phone}
                                        </p>
                                    </div>
                                    <span className="w-fit rounded-full border border-slate-300 px-3 py-1 text-base font-medium">
                                        {statusLabel(appointment.status)}
                                    </span>
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            </main>
        </>
    );
}
