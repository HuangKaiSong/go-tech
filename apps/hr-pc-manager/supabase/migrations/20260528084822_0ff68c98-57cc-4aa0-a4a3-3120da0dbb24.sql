
-- App roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'hr', 'manager', 'employee');

-- =========================
-- ORGANIZATION
-- =========================
CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  manager_name TEXT,
  budget NUMERIC(14,2) DEFAULT 0,
  description TEXT,
  member_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE,
  title TEXT NOT NULL,
  level TEXT,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  description TEXT,
  permissions JSONB DEFAULT '{}'::jsonb,
  member_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================
-- EMPLOYEES
-- =========================
CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_no TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  department_name TEXT,
  role_id UUID REFERENCES public.roles(id) ON DELETE SET NULL,
  position TEXT,
  gender TEXT,
  birthday DATE,
  id_number TEXT,
  address TEXT,
  join_date DATE,
  leave_date DATE,
  status TEXT DEFAULT '在職',
  avatar_url TEXT,
  emergency_contact JSONB,
  bank_account TEXT,
  base_salary NUMERIC(12,2) DEFAULT 0,
  extra JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.onboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE,
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
  candidate_name TEXT NOT NULL,
  position TEXT,
  department_name TEXT,
  status TEXT DEFAULT '進行中',
  progress INTEGER DEFAULT 0,
  steps JSONB DEFAULT '[]'::jsonb,
  invite_token TEXT,
  invite_expires_at TIMESTAMPTZ,
  start_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.offboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE,
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
  employee_name TEXT NOT NULL,
  reason TEXT,
  last_day DATE,
  status TEXT DEFAULT '進行中',
  progress INTEGER DEFAULT 0,
  steps JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================
-- ATTENDANCE / APPROVAL
-- =========================
CREATE TABLE public.attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
  employee_name TEXT,
  date DATE NOT NULL,
  clock_in TIME,
  clock_out TIME,
  status TEXT DEFAULT '正常',
  location TEXT,
  hours_worked NUMERIC(5,2),
  remark TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.approval_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  conditions JSONB DEFAULT '{}'::jsonb,
  levels JSONB DEFAULT '[]'::jsonb,
  active BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  applicant_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  applicant_name TEXT,
  department_name TEXT,
  type TEXT NOT NULL,
  sub_type TEXT,
  summary TEXT,
  status TEXT DEFAULT '待審',
  current_node TEXT,
  payload JSONB DEFAULT '{}'::jsonb,
  attachments JSONB DEFAULT '[]'::jsonb,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.approval_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  approval_id UUID REFERENCES public.approvals(id) ON DELETE CASCADE,
  node TEXT,
  approver_name TEXT,
  action TEXT,
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================
-- PAYROLL
-- =========================
CREATE TABLE public.payroll_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE,
  name TEXT NOT NULL,
  effective_date DATE,
  base_salary NUMERIC(12,2) DEFAULT 0,
  allowances JSONB DEFAULT '[]'::jsonb,
  deductions JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT '草稿',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.payroll_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE,
  period TEXT NOT NULL,
  status TEXT DEFAULT '草稿',
  total_amount NUMERIC(14,2) DEFAULT 0,
  employee_count INTEGER DEFAULT 0,
  remark TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.payroll_calc_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calc_id UUID REFERENCES public.payroll_calculations(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  employee_name TEXT,
  base NUMERIC(12,2) DEFAULT 0,
  allowance NUMERIC(12,2) DEFAULT 0,
  bonus NUMERIC(12,2) DEFAULT 0,
  deduction NUMERIC(12,2) DEFAULT 0,
  tax NUMERIC(12,2) DEFAULT 0,
  net NUMERIC(12,2) DEFAULT 0,
  details JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE public.bonus_penalty (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE,
  employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  employee_name TEXT,
  type TEXT,
  amount NUMERIC(12,2) DEFAULT 0,
  reason TEXT,
  period TEXT,
  status TEXT DEFAULT '待審核',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.payroll_distributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE,
  period TEXT NOT NULL,
  total_amount NUMERIC(14,2) DEFAULT 0,
  employee_count INTEGER DEFAULT 0,
  status TEXT DEFAULT '草稿',
  method TEXT DEFAULT '銀行轉帳',
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.payroll_dist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dist_id UUID REFERENCES public.payroll_distributions(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  employee_name TEXT,
  amount NUMERIC(12,2) DEFAULT 0,
  bank_account TEXT,
  status TEXT DEFAULT '待發放'
);

-- =========================
-- PERFORMANCE
-- =========================
CREATE TABLE public.performance_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE,
  name TEXT NOT NULL,
  cycle TEXT,
  weights JSONB DEFAULT '{}'::jsonb,
  kpi_template JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT '進行中',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.performance_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE,
  plan_id UUID REFERENCES public.performance_plans(id) ON DELETE SET NULL,
  plan_name TEXT,
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
  employee_name TEXT,
  department_name TEXT,
  position TEXT,
  cycle TEXT,
  self_score NUMERIC(5,2),
  peer_score NUMERIC(5,2),
  manager_score NUMERIC(5,2),
  final_score NUMERIC(5,2),
  grade TEXT,
  status TEXT DEFAULT '待自評',
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================
-- TRAINING
-- =========================
CREATE TABLE public.training_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE,
  name TEXT NOT NULL,
  type TEXT,
  target JSONB DEFAULT '{}'::jsonb,
  modules JSONB DEFAULT '[]'::jsonb,
  duration_hours INTEGER DEFAULT 0,
  required BOOLEAN DEFAULT false,
  status TEXT DEFAULT '進行中',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.training_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES public.training_plans(id) ON DELETE CASCADE,
  plan_name TEXT,
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
  employee_name TEXT,
  department_name TEXT,
  progress INTEGER DEFAULT 0,
  score NUMERIC(5,2),
  status TEXT DEFAULT '未開始',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================
-- NOTIFICATIONS / USER ROLES
-- =========================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  title TEXT NOT NULL,
  content TEXT,
  type TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE(user_id, role)
);

-- =========================
-- GRANTS (Data API)
-- =========================
DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname='public' LOOP
    EXECUTE format('GRANT SELECT ON public.%I TO anon', t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
  END LOOP;
END $$;

-- =========================
-- RLS — demo policies
-- anon: SELECT; authenticated: full CRUD
-- =========================
DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename <> 'user_roles' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "demo_read_all" ON public.%I FOR SELECT USING (true)', t);
    EXECUTE format('CREATE POLICY "demo_auth_write" ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)', t);
  END LOOP;
END $$;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_roles_self_read" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- has_role helper
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN
    SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    JOIN pg_attribute a ON a.attrelid=c.oid AND a.attname='updated_at'
    WHERE n.nspname='public' AND c.relkind='r'
  LOOP
    EXECUTE format('CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()', t, t);
  END LOOP;
END $$;
