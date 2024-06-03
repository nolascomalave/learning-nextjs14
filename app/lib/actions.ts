'use server';

/* import fs from 'fs';
import path from 'path'; */
import { z } from 'zod';
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const FormSchema = z.object({
    id: z.string(),
    customerId: z.string({
      invalid_type_error: 'Please select a customer.',
    }),
    amount: z.coerce
      .number()
      .gt(0, { message: 'Please enter an amount greater than $0.' }),
    status: z.enum(['pending', 'paid'], {
      invalid_type_error: 'Please select an invoice status.',
    }),
    date: z.string(),
  });

const CreateInvoice = FormSchema.omit({ id: true, date: true });
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export async function createInvoice(formData: FormData) {
    try {
        // return console.log(__dirname);

        const { customerId, amount, status } = CreateInvoice.parse({
            customerId: formData.get('customerId'),
            amount: formData.get('amount'),
            status: formData.get('status'),
        });
        const amountInCents = amount * 100;
        const now = new Date().toISOString();

        console.log(now);

        await sql`
            INSERT INTO invoices (customer_id, amount, status, date)
            VALUES (${customerId}, ${amountInCents}, ${status}, ${now})
        `;

        /* const rawFormData = {
            customerId: formData.get('customerId'),
            amount: formData.get('amount'),
            status: formData.get('status'),
        };
        // Test it out:
        console.log(rawFormData);
        console.log(typeof rawFormData.amount);
        console.log(Object.fromEntries(formData.entries())); */
    } catch (err) {
        return {
            message: 'Database Error: Failed to Create Invoice.',
        };
    }

    const route = '/dashboard/invoices';
    revalidatePath(route);
    redirect(route);
}

export async function updateInvoice(id: string, formData: FormData) {
    try {
        const { customerId, amount, status } = UpdateInvoice.parse({
            customerId: formData.get('customerId'),
            amount: formData.get('amount'),
            status: formData.get('status'),
        });

        const amountInCents = amount * 100;

        await sql`
            UPDATE invoices
            SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
            WHERE id = ${id}
        `;
    } catch (err) {
        return {
            message: 'Database Error: Failed to Update Invoice.'
        };
    }

    const route = '/dashboard/invoices';
    revalidatePath(route);
    redirect(route);
}

export async function deleteInvoice(id: string) {
    throw new Error('Failed to Delete Invoice');

    try {
        await sql`DELETE FROM invoices WHERE id = ${id}`;
        revalidatePath('/dashboard/invoices');
        return { message: 'Deleted Invoice.' };
    } catch (err) {
        return { message: 'Database Error: Failed to Delete Invoice.' };
    }
}