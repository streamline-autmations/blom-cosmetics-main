// Per-instructor booking notifications.
//
// Instructors who teach at their own venue get their own n8n workflow, which
// emails/WhatsApps them the booking. Matching is on keywords in the
// "<name> - <location>" string that CourseDetailPage sends as `instructor`.
//
// This lives in one place because it has to run identically for BOTH payment
// providers. It previously existed only in payfast-itn.ts, so a Payflex booking
// for Yolanda/Rochelle/Natasha silently never reached them.
//
// Avané / Blom HQ courses deliberately match nothing here — those bookings are
// covered by the generic `notify-order` webhook that every paid order fires.

const N8N_ORKNEY_WEBHOOK_URL = 'https://dockerfile-1n82.onrender.com/webhook/orkney-course-booking'
const N8N_ROCHELLE_WEBHOOK_URL = 'https://dockerfile-1n82.onrender.com/webhook/rochelle-course-booking'
const N8N_NATASHA_WEBHOOK_URL = 'https://dockerfile-1n82.onrender.com/webhook/natasha-course-booking'

export interface InstructorNotifyInput {
  /** The "<name> - <location>" string stored on course_purchases.instructor */
  instructor: string
  buyerName: string
  buyerEmail: string
  buyerPhone: string
  courseTitle: string
  selectedPackage: string
  selectedDate: string
  /** Amount paid, in Rands (PayFast sends a string; Payflex computes from the order) */
  amountPaid: string | number
}

/**
 * Fire the matching instructor webhook(s) for a paid course booking.
 *
 * Never throws: a notification failure must not roll back an already-paid
 * order. Each target is attempted independently and logged.
 */
export async function notifyInstructor(input: InstructorNotifyInput): Promise<void> {
  const key = String(input.instructor || '').toLowerCase()
  if (!key) return

  const targets: Array<[string, string]> = []
  // Yolanda teaches at Orkney and also runs workshops at other venues (e.g. Randfontein),
  // so match her name as well as her home studio.
  if (key.includes('orkney') || key.includes('yolanda')) targets.push(['Orkney', N8N_ORKNEY_WEBHOOK_URL])
  if (key.includes('rochelle')) targets.push(['Rochelle', N8N_ROCHELLE_WEBHOOK_URL])
  if (key.includes('natasha')) targets.push(['Natasha', N8N_NATASHA_WEBHOOK_URL])

  if (targets.length === 0) return

  const payload = JSON.stringify({
    buyer_name: input.buyerName,
    buyer_email: input.buyerEmail,
    buyer_phone: input.buyerPhone,
    course_title: input.courseTitle,
    selected_package: input.selectedPackage,
    selected_date: input.selectedDate,
    amount_paid: input.amountPaid,
    instructor: input.instructor
  })

  for (const [label, url] of targets) {
    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload
      })
      console.log(`✅ ${label} booking notification sent`)
    } catch (e) {
      console.error(`${label} notification error:`, e)
    }
  }
}
