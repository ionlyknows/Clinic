import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import type { Service } from '../types';

function ServiceRow({ service }: { service: Service }) {
    const form = useForm({ is_active: !service.is_active });
    const toggle = () =>
        form.patch(`/admin/services/${service.id}/active`, {
            preserveScroll: true,
        });
    return (
        <article className="flex flex-col gap-4 border-b border-slate-200 p-5 last:border-0 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold">{service.name}</h2>
                    <span className="rounded-full border border-slate-300 px-2.5 py-0.5 text-base">
                        {service.is_active ? 'Active' : 'Inactive'}
                    </span>
                </div>
                <p className="mt-1 text-base text-slate-700">
                    {service.duration_minutes} minutes
                    {service.fee !== null && service.fee !== ''
                        ? ` · ₱${Number(service.fee).toFixed(2)}`
                        : ''}
                </p>
                {service.description && (
                    <p className="mt-2 text-base break-words text-slate-700">
                        {service.description}
                    </p>
                )}
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
                <Link
                    href={`/admin/services/${service.id}/edit`}
                    className="inline-flex min-h-11 items-center rounded-md border border-slate-300 px-4 font-medium hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
                >
                    Edit
                </Link>
                <Button
                    type="button"
                    variant="outline"
                    className="h-11"
                    disabled={form.processing}
                    onClick={toggle}
                >
                    {form.processing
                        ? 'Saving…'
                        : service.is_active
                          ? 'Deactivate'
                          : 'Activate'}
                </Button>
                {form.errors.is_active && (
                    <span role="alert" className="text-base text-red-800">
                        {form.errors.is_active}
                    </span>
                )}
            </div>
        </article>
    );
}

export default function ServicesIndex({ services }: { services: Service[] }) {
    return (
        <>
            <Head title="Services" />
            <main className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6">
                <header className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <p className="text-base font-semibold text-teal-800">
                            Clinic configuration
                        </p>
                        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
                            Services
                        </h1>
                        <p className="mt-2 text-base text-slate-700">
                            Active services can be requested online.
                            Deactivation preserves existing appointments.
                        </p>
                    </div>
                    <Link
                        href="/admin/services/create"
                        className="inline-flex min-h-11 items-center rounded-lg bg-teal-800 px-4 font-semibold text-white hover:bg-teal-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
                    >
                        Add service
                    </Link>
                </header>
                <section
                    aria-label="Configured services"
                    className="overflow-hidden rounded-xl border border-slate-200 bg-white"
                >
                    {services.length ? (
                        services.map((service) => (
                            <ServiceRow key={service.id} service={service} />
                        ))
                    ) : (
                        <p className="p-7 text-base text-slate-700">
                            No services yet. Add a service to allow patients to
                            request appointments.
                        </p>
                    )}
                </section>
            </main>
        </>
    );
}
