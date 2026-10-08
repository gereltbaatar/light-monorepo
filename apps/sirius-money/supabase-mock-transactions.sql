-- expense-tracker — 5,000 mock transactions spread over the last 365 days
-- Run manually in Supabase Dashboard → SQL Editor, after supabase-transactions.sql
-- and supabase-transaction-category.sql. Put your login email on the line marked ← below;
-- if it doesn't match, the most recently signed-in user is used.
--
-- 60 income rows (salary twice a month, gifts, side income) + 4,940 expenses.
-- Every row from one run shares the same created_at, which the cleanup query
-- at the bottom uses to remove them again.

select setseed(0.42);

with target as (
  -- Prefers the email match; falls back to the most recent sign-in.
  select id from auth.users
  order by
    regexp_replace(lower(coalesce(email, '')), '[^a-z0-9@._+-]', '', 'g')
      = regexp_replace(lower('you@example.com'), '[^a-z0-9@._+-]', '', 'g') desc,  -- ← your login email
    last_sign_in_at desc nulls last
  limit 1
),

-- Expenses -------------------------------------------------------------------
expense_rolls as (
  select
    random() as r_category,
    random() as r_title,
    random() as r_amount,
    floor(random() * 365)::int as days_ago
  from generate_series(1, 4940)
),
expenses as (
  select
    days_ago,
    r_title,
    r_amount,
    case
      when r_category < 0.32 then 'food'
      when r_category < 0.49 then 'coffee'
      when r_category < 0.61 then 'shopping'
      when r_category < 0.76 then 'taxi'
      when r_category < 0.84 then 'entertainment'
      when r_category < 0.86 then 'bills'
      when r_category < 0.91 then 'health'
      else 'other'
    end as category
  from expense_rolls
),
expense_rows as (
  select
    'expense'::public.transaction_type as type,
    e.category,
    current_date - e.days_ago as occurred_at,
    case e.category
      when 'food' then (array['Номин супермаркет', 'Emart', 'UBMART', 'Сансар супермаркет',
        'Хүнсний дэлгүүр', 'Modern Nomads', 'KFC', 'Pizza Hut', 'Burger King',
        'Цуйван хоолны газар', 'Хуушуурын газар', 'Rosewood'])[1 + floor(e.r_title * 12)::int]
      when 'coffee' then (array['Tom N Toms', 'Caffe Bene', 'Starbucks', 'Drip Coffee',
        'Coffee Bean', 'Bull Coffee'])[1 + floor(e.r_title * 6)::int]
      when 'shopping' then (array['State Department Store', 'Shangri-La Mall', 'Хүүхдийн 100',
        'Nomin Home', 'Zara', 'Uniqlo', 'Apple Store', 'Мобиком дэлгүүр'])[1 + floor(e.r_title * 8)::int]
      when 'taxi' then (array['UBCab', 'Такси', 'Автобусны карт', 'Петровис шатахуун',
        'Шунхлай шатахуун'])[1 + floor(e.r_title * 5)::int]
      when 'entertainment' then (array['Тэнгис кино театр', 'Өргөө кино театр', 'Netflix',
        'Spotify', 'Боулинг', 'Караоке', 'Концертын тасалбар'])[1 + floor(e.r_title * 7)::int]
      when 'bills' then (array['Цахилгааны төлбөр', 'Univision интернэт', 'Unitel утасны төлбөр',
        'Mobicom утасны төлбөр', 'СӨХ төлбөр', 'Дулааны төлбөр'])[1 + floor(e.r_title * 6)::int]
      when 'health' then (array['Эмийн сан', 'Интермед эмнэлэг', 'Шүдний эмнэлэг', 'Фитнес',
        'Монос эмийн сан'])[1 + floor(e.r_title * 5)::int]
      else (array['Үсчин', 'Хими цэвэрлэгээ', 'Хандив', 'Бэлэг', 'Шуудан',
        'Бусад зардал'])[1 + floor(e.r_title * 6)::int]
    end as title,
    -- Squaring the roll skews toward small purchases, as real spending does.
    greatest(100, round((
      case e.category
        when 'food' then 3000 + power(e.r_amount, 2) * 32000
        when 'coffee' then 4500 + e.r_amount * 7500
        when 'shopping' then 8000 + power(e.r_amount, 3) * 192000
        when 'taxi' then 2000 + power(e.r_amount, 2) * 13000
        when 'entertainment' then 5000 + power(e.r_amount, 2) * 45000
        when 'bills' then 20000 + e.r_amount * 130000
        when 'health' then 5000 + power(e.r_amount, 2) * 75000
        else 1000 + power(e.r_amount, 2) * 39000
      end
    ) / 100) * 100) as amount
  from expenses e
),

-- Income ---------------------------------------------------------------------
-- Salary on the 10th and 25th of each of the last 12 months, never in the future.
salary_rows as (
  select
    'income'::public.transaction_type as type,
    'salary' as category,
    pay_day::date as occurred_at,
    'Цалин' as title,
    round((3600000 + random() * 600000) / 1000) * 1000 as amount
  from generate_series(0, 11) as m,
    lateral (values
      (date_trunc('month', current_date) - make_interval(months => m) + interval '9 days'),
      (date_trunc('month', current_date) - make_interval(months => m) + interval '24 days')
    ) as d(pay_day)
  where pay_day::date <= current_date
  limit 24
),
extra_income_rows as (
  select
    'income'::public.transaction_type as type,
    case when i % 3 = 0 then 'gift' else 'other' end as category,
    current_date - floor(random() * 365)::int as occurred_at,
    case when i % 3 = 0 then 'Бэлэг мөнгө' else (array['Нэмэлт орлого', 'Буцаалт',
      'Фриланс ажил', 'Хуучин эд зарсан'])[1 + floor(random() * 4)::int] end as title,
    round((20000 + power(random(), 2) * 480000) / 1000) * 1000 as amount
  from generate_series(1, 60) as i
),
income_rows as (
  select * from salary_rows
  union all
  -- Top up so income totals exactly 60 rows even early in the month.
  select * from extra_income_rows
  limit 60
)

insert into public.ex_transactions (user_id, type, title, amount, occurred_at, category)
select t.id, r.type, r.title, r.amount, r.occurred_at, r.category
from target t
cross join (
  select * from expense_rows
  union all
  select * from income_rows
) r;

-- Check: should print 5000 for the account above.
select u.email as seeded_user, count(*) as mock_rows
from public.ex_transactions t
join auth.users u on u.id = t.user_id
where t.created_at = (
    select created_at from public.ex_transactions
    group by created_at having count(*) >= 1000
    order by created_at desc limit 1
  )
group by u.email;

-- Cleanup (run separately when you're done) -----------------------------------
-- Real entries are inserted one at a time, so only a seed run shares a timestamp
-- across 1,000+ rows.
--
-- delete from public.ex_transactions
-- where created_at in (
--   select created_at from public.ex_transactions
--   group by created_at having count(*) >= 1000
-- );
