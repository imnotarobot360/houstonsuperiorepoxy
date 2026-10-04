-- Find leads whose phone number was corrupted by the +1 masking bug.
--
-- READ ONLY. Nothing in this file writes, updates or deletes.
--
-- THE BUG (fixed 2026-10-04, see lib/leads.ts): the landing-page funnel masked
-- the phone field with digits.slice(0, 10) and no country-code handling, so an
-- autofilled "+1 346 782 0903" became 1346782090 and displayed as
-- "(134) 678-2090". Ten digits, so it passed validation and was stored.
--
-- HOW THESE ARE IDENTIFIED WITH CERTAINTY: a North American area code can
-- never begin with 1 — the first digit of an area code is 2-9 by definition.
-- So any stored 10-digit number starting with 1 is not a real US number,
-- whatever produced it. There is no false positive to worry about here.
--
-- Run each statement ON ITS OWN. The Vercel and Neon SQL boxes use a prepared
-- statement and refuse more than one command per run.


-- 1. THE COUNT. One row, four numbers.
select
  count(*) filter (
    where length(phone_normalized) = 10 and phone_normalized like '1%'
  ) as mangled_by_the_plus_one_bug,
  count(*) filter (
    where length(phone_normalized) <> 10
  ) as not_ten_digits,
  count(*) filter (
    where length(phone_normalized) = 10
      and phone_normalized not like '1%'
      and substring(phone_normalized from 4 for 1) in ('0', '1')
  ) as impossible_exchange_code,
  count(*) as total_leads
from estimate_leads;


-- 2. THE AFFECTED LEADS, so the office can work the list.
--
-- `first_nine_of_real_number` is what survived: the stored value minus its
-- bogus leading 1 is the first NINE digits of the real number. The tenth was
-- pushed off the end by the truncation and is NOT in the database, so these
-- cannot be repaired by a script — only by calling the ten candidates, or by
-- using the email address, which was never affected.
select
  id,
  created_at,
  name,
  phone                                   as shown_to_us,
  substring(phone_normalized from 2) || '?' as first_nine_of_real_number,
  email,
  zip,
  landing_path,
  status
from estimate_leads
where length(phone_normalized) = 10
  and phone_normalized like '1%'
order by created_at desc;


-- 3. WHERE THEY CAME FROM, to confirm the funnel was the only source.
-- If anything other than the landing page shows up here, the mask was not the
-- whole story and the other form needs looking at.
select
  coalesce(landing_path, '(none recorded)') as landing_path,
  count(*) as mangled
from estimate_leads
where length(phone_normalized) = 10
  and phone_normalized like '1%'
group by 1
order by 2 desc;


-- 4. HOW MANY ARE STILL REACHABLE. A mangled number with an email on it is a
-- lead that can be recovered today; one without is a lead that is gone unless
-- somebody rings the ten candidates.
select
  count(*) filter (where email is not null and email <> '') as has_email,
  count(*) filter (where email is null or email = '')       as phone_only,
  count(*)                                                  as mangled_total
from estimate_leads
where length(phone_normalized) = 10
  and phone_normalized like '1%';
