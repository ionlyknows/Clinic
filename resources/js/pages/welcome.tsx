import { Head, Link } from '@inertiajs/react';
import { ArrowRight, Clock3, HeartPulse, ShieldCheck } from 'lucide-react';

type Service = {
    id: number;
    name: string;
    description: string | null;
    duration_minutes: number;
    fee: number | string | null;
};
type ClinicHour = {
    weekday: number;
    is_closed: boolean;
    opens_at: string | null;
    closes_at: string | null;
};
type Props = {
    clinicName: string;
    clinicContact: string | null;
    services: Service[];
    hours: ClinicHour[];
    bookingConfigured: boolean;
};

const weekdays = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
];
const money = (fee: Service['fee']) =>
    fee === null || fee === ''
        ? null
        : new Intl.NumberFormat(undefined, {
              style: 'currency',
              currency: 'PHP',
          }).format(Number(fee));
const time = (value: string | null) => (value ? value.slice(0, 5) : '');

export default function Welcome({
    clinicName,
    clinicContact,
    services,
    hours,
    bookingConfigured,
}: Props) {
    return (
        <>
            <Head title={clinicName}>
                <meta
                    name="description"
                    content={`Book an appointment with ${clinicName}.`}
                />
            </Head>
            <div className="min-h-screen bg-[#f5f8fa] text-slate-900">
                <header className="border-b border-slate-200 bg-white">
                    <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
                        <a
                            href="#top"
                            className="flex items-center gap-3 rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-700"
                        >
                            <span className="flex size-10 items-center justify-center rounded-xl bg-teal-800 text-white">
                                <HeartPulse aria-hidden="true" />
                            </span>
                            <span className="font-semibold tracking-tight">
                                {clinicName}
                            </span>
                        </a>
                        <nav
                            aria-label="Main navigation"
                            className="flex items-center gap-5 text-base"
                        >
                            <a
                                className="hidden text-slate-700 hover:text-teal-800 sm:inline"
                                href="#services"
                            >
                                Services
                            </a>
                            <a
                                className="hidden text-slate-700 hover:text-teal-800 sm:inline"
                                href="#hours"
                            >
                                Opening hours
                            </a>
                            <Link
                                href="/book"
                                className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-teal-800 px-4 font-medium text-white hover:bg-teal-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
                            >
                                Book an appointment{' '}
                                <ArrowRight size={17} aria-hidden="true" />
                            </Link>
                        </nav>
                    </div>
                </header>
                <main id="top">
                    <section className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:px-8 sm:py-20 md:grid-cols-[1.2fr_.8fr] md:items-center">
                        <div>
                            <p className="mb-4 font-semibold text-teal-800">
                                Care that fits your day
                            </p>
                            <h1 className="max-w-2xl text-4xl leading-tight font-semibold tracking-tight sm:text-5xl">
                                A simple way to plan your next visit.
                            </h1>
                            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-700">
                                Choose a service and a time that works for you.
                                Your request is sent to the clinic for
                                confirmation.
                            </p>
                            <div className="mt-8 flex flex-wrap gap-3">
                                <Link
                                    href="/book"
                                    className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-teal-800 px-6 font-semibold text-white hover:bg-teal-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
                                >
                                    Book an appointment{' '}
                                    <ArrowRight size={18} aria-hidden="true" />
                                </Link>
                                <a
                                    href="#services"
                                    className="inline-flex min-h-12 items-center rounded-lg border border-slate-300 bg-white px-6 font-semibold hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
                                >
                                    View services
                                </a>
                            </div>
                            <p className="mt-5 flex items-center gap-2 text-base text-slate-700">
                                <ShieldCheck
                                    size={18}
                                    className="text-teal-800"
                                    aria-hidden="true"
                                />{' '}
                                Your contact details are used to manage your
                                appointment request.
                            </p>
                        </div>
                        <div className="rounded-2xl border border-teal-100 bg-white p-7 shadow-sm sm:p-9">
                            <div className="flex size-12 items-center justify-center rounded-xl bg-teal-50 text-teal-900">
                                <Clock3 aria-hidden="true" />
                            </div>
                            <h2 className="mt-5 text-xl font-semibold">
                                What to expect
                            </h2>
                            <ol className="mt-5 space-y-4 text-base text-slate-700">
                                <li className="flex gap-3">
                                    <span className="font-semibold text-teal-800">
                                        01
                                    </span>{' '}
                                    Choose a service and available time.
                                </li>
                                <li className="flex gap-3">
                                    <span className="font-semibold text-teal-800">
                                        02
                                    </span>{' '}
                                    Share your name and contact details.
                                </li>
                                <li className="flex gap-3">
                                    <span className="font-semibold text-teal-800">
                                        03
                                    </span>{' '}
                                    Wait for the clinic to confirm your request.
                                </li>
                            </ol>
                        </div>
                    </section>
                    {!bookingConfigured && (
                        <div
                            role="status"
                            className="mx-auto mb-10 max-w-6xl px-5 sm:px-8"
                        >
                            <p className="rounded-lg border border-amber-300 bg-amber-50 px-5 py-4 text-base text-amber-950">
                                Online booking is not available yet. The clinic
                                needs to configure its opening hours first.
                                {clinicContact
                                    ? ` Contact the clinic at ${clinicContact}.`
                                    : ''}
                            </p>
                        </div>
                    )}
                    <section
                        id="services"
                        className="scroll-mt-8 bg-white py-14 sm:py-16"
                    >
                        <div className="mx-auto max-w-6xl px-5 sm:px-8">
                            <p className="font-semibold text-teal-800">
                                Our services
                            </p>
                            <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                                Care for your needs
                            </h2>
                            {services.length ? (
                                <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {services.map((service) => (
                                        <article
                                            key={service.id}
                                            className="rounded-xl border border-slate-200 p-6"
                                        >
                                            <h3 className="text-lg font-semibold">
                                                {service.name}
                                            </h3>
                                            <p className="mt-2 min-h-12 text-base leading-6 text-slate-700">
                                                {service.description ||
                                                    'Please contact the clinic for more information.'}
                                            </p>
                                            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-base text-slate-700">
                                                <span>
                                                    {service.duration_minutes}{' '}
                                                    minutes
                                                </span>
                                                {money(service.fee) && (
                                                    <span>
                                                        {money(service.fee)}
                                                    </span>
                                                )}
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            ) : (
                                <p className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-6 text-base text-slate-700">
                                    Service information is being prepared.
                                    Please contact the clinic for details.
                                </p>
                            )}
                        </div>
                    </section>
                    <section id="hours" className="scroll-mt-8 py-14 sm:py-16">
                        <div className="mx-auto grid max-w-6xl gap-10 px-5 sm:px-8 md:grid-cols-2">
                            <div>
                                <p className="font-semibold text-teal-800">
                                    Plan your visit
                                </p>
                                <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                                    Opening hours
                                </h2>
                                <p className="mt-3 text-base text-slate-700">
                                    Hours may change on holidays. Please contact
                                    the clinic if you have a question.
                                </p>
                                {clinicContact && (
                                    <p className="mt-5 text-base">
                                        <span className="font-semibold">
                                            Contact:
                                        </span>{' '}
                                        {clinicContact}
                                    </p>
                                )}
                            </div>
                            <dl className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white px-5">
                                {weekdays.map((day, index) => {
                                    const row = hours.find(
                                        (item) => item.weekday === index + 1,
                                    );
                                    return (
                                        <div
                                            key={day}
                                            className="flex justify-between gap-4 py-3 text-base"
                                        >
                                            <dt className="font-medium">
                                                {day}
                                            </dt>
                                            <dd className="text-right text-slate-700">
                                                {!row || row.is_closed
                                                    ? 'Closed'
                                                    : `${time(row.opens_at)} – ${time(row.closes_at)}`}
                                            </dd>
                                        </div>
                                    );
                                })}
                            </dl>
                        </div>
                    </section>
                </main>
                <footer className="border-t border-slate-200 bg-white">
                    <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-6 text-base text-slate-700 sm:px-8">
                        <span className="font-semibold text-slate-900">
                            {clinicName}
                        </span>
                        <p>
                            We use the details you provide only to manage your
                            appointment request. Please do not include health
                            information in this form.
                        </p>
                    </div>
                </footer>
            </div>
        </>
    );
}
