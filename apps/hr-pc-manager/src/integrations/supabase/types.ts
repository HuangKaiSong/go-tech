export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.5';
  };
  public: {
    CompositeTypes: {
      [_ in never]: never;
    };
    Enums: {
      app_role: 'admin' | 'employee' | 'hr' | 'manager';
    };
    Functions: {
      has_role: {
        Args: {
          _role: Database['public']['Enums']['app_role'];
          _user_id: string;
        };
        Returns: boolean;
      };
    };
    Tables: {
      approval_history: {
        Insert: {
          action?: string | null;
          approval_id?: string | null;
          approver_name?: string | null;
          comment?: string | null;
          created_at?: string;
          id?: string;
          node?: string | null;
        };
        Relationships: [
          {
            columns: ['approval_id'];
            foreignKeyName: 'approval_history_approval_id_fkey';
            isOneToOne: false;
            referencedColumns: ['id'];
            referencedRelation: 'approvals';
          }
        ];
        Row: {
          action: string | null;
          approval_id: string | null;
          approver_name: string | null;
          comment: string | null;
          created_at: string;
          id: string;
          node: string | null;
        };
        Update: {
          action?: string | null;
          approval_id?: string | null;
          approver_name?: string | null;
          comment?: string | null;
          created_at?: string;
          id?: string;
          node?: string | null;
        };
      };
      approval_rules: {
        Insert: {
          active?: boolean | null;
          conditions?: Json | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          levels?: Json | null;
          name: string;
          type: string;
          updated_at?: string;
        };
        Relationships: [];
        Row: {
          active: boolean | null;
          conditions: Json | null;
          created_at: string;
          description: string | null;
          id: string;
          levels: Json | null;
          name: string;
          type: string;
          updated_at: string;
        };
        Update: {
          active?: boolean | null;
          conditions?: Json | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          levels?: Json | null;
          name?: string;
          type?: string;
          updated_at?: string;
        };
      };
      approvals: {
        Insert: {
          applicant_id?: string | null;
          applicant_name?: string | null;
          attachments?: Json | null;
          code: string;
          created_at?: string;
          current_node?: string | null;
          department_name?: string | null;
          id?: string;
          payload?: Json | null;
          status?: string | null;
          sub_type?: string | null;
          submitted_at?: string | null;
          summary?: string | null;
          type: string;
          updated_at?: string;
        };
        Relationships: [
          {
            columns: ['applicant_id'];
            foreignKeyName: 'approvals_applicant_id_fkey';
            isOneToOne: false;
            referencedColumns: ['id'];
            referencedRelation: 'employees';
          }
        ];
        Row: {
          applicant_id: string | null;
          applicant_name: string | null;
          attachments: Json | null;
          code: string;
          created_at: string;
          current_node: string | null;
          department_name: string | null;
          id: string;
          payload: Json | null;
          status: string | null;
          sub_type: string | null;
          submitted_at: string | null;
          summary: string | null;
          type: string;
          updated_at: string;
        };
        Update: {
          applicant_id?: string | null;
          applicant_name?: string | null;
          attachments?: Json | null;
          code?: string;
          created_at?: string;
          current_node?: string | null;
          department_name?: string | null;
          id?: string;
          payload?: Json | null;
          status?: string | null;
          sub_type?: string | null;
          submitted_at?: string | null;
          summary?: string | null;
          type?: string;
          updated_at?: string;
        };
      };
      attendance_records: {
        Insert: {
          clock_in?: string | null;
          clock_out?: string | null;
          created_at?: string;
          date: string;
          employee_id?: string | null;
          employee_name?: string | null;
          hours_worked?: number | null;
          id?: string;
          location?: string | null;
          remark?: string | null;
          status?: string | null;
        };
        Relationships: [
          {
            columns: ['employee_id'];
            foreignKeyName: 'attendance_records_employee_id_fkey';
            isOneToOne: false;
            referencedColumns: ['id'];
            referencedRelation: 'employees';
          }
        ];
        Row: {
          clock_in: string | null;
          clock_out: string | null;
          created_at: string;
          date: string;
          employee_id: string | null;
          employee_name: string | null;
          hours_worked: number | null;
          id: string;
          location: string | null;
          remark: string | null;
          status: string | null;
        };
        Update: {
          clock_in?: string | null;
          clock_out?: string | null;
          created_at?: string;
          date?: string;
          employee_id?: string | null;
          employee_name?: string | null;
          hours_worked?: number | null;
          id?: string;
          location?: string | null;
          remark?: string | null;
          status?: string | null;
        };
      };
      bonus_penalty: {
        Insert: {
          amount?: number | null;
          code?: string | null;
          created_at?: string;
          employee_id?: string | null;
          employee_name?: string | null;
          id?: string;
          period?: string | null;
          reason?: string | null;
          status?: string | null;
          type?: string | null;
        };
        Relationships: [
          {
            columns: ['employee_id'];
            foreignKeyName: 'bonus_penalty_employee_id_fkey';
            isOneToOne: false;
            referencedColumns: ['id'];
            referencedRelation: 'employees';
          }
        ];
        Row: {
          amount: number | null;
          code: string | null;
          created_at: string;
          employee_id: string | null;
          employee_name: string | null;
          id: string;
          period: string | null;
          reason: string | null;
          status: string | null;
          type: string | null;
        };
        Update: {
          amount?: number | null;
          code?: string | null;
          created_at?: string;
          employee_id?: string | null;
          employee_name?: string | null;
          id?: string;
          period?: string | null;
          reason?: string | null;
          status?: string | null;
          type?: string | null;
        };
      };
      departments: {
        Insert: {
          budget?: number | null;
          code?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          manager_name?: string | null;
          member_count?: number | null;
          name: string;
          parent_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            columns: ['parent_id'];
            foreignKeyName: 'departments_parent_id_fkey';
            isOneToOne: false;
            referencedColumns: ['id'];
            referencedRelation: 'departments';
          }
        ];
        Row: {
          budget: number | null;
          code: string | null;
          created_at: string;
          description: string | null;
          id: string;
          manager_name: string | null;
          member_count: number | null;
          name: string;
          parent_id: string | null;
          updated_at: string;
        };
        Update: {
          budget?: number | null;
          code?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          manager_name?: string | null;
          member_count?: number | null;
          name?: string;
          parent_id?: string | null;
          updated_at?: string;
        };
      };
      employees: {
        Insert: {
          address?: string | null;
          avatar_url?: string | null;
          bank_account?: string | null;
          base_salary?: number | null;
          birthday?: string | null;
          created_at?: string;
          department_id?: string | null;
          department_name?: string | null;
          email?: string | null;
          emergency_contact?: Json | null;
          employee_no: string;
          extra?: Json | null;
          gender?: string | null;
          id?: string;
          id_number?: string | null;
          join_date?: string | null;
          leave_date?: string | null;
          name: string;
          phone?: string | null;
          position?: string | null;
          role_id?: string | null;
          status?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            columns: ['department_id'];
            foreignKeyName: 'employees_department_id_fkey';
            isOneToOne: false;
            referencedColumns: ['id'];
            referencedRelation: 'departments';
          },
          {
            columns: ['role_id'];
            foreignKeyName: 'employees_role_id_fkey';
            isOneToOne: false;
            referencedColumns: ['id'];
            referencedRelation: 'roles';
          }
        ];
        Row: {
          address: string | null;
          avatar_url: string | null;
          bank_account: string | null;
          base_salary: number | null;
          birthday: string | null;
          created_at: string;
          department_id: string | null;
          department_name: string | null;
          email: string | null;
          emergency_contact: Json | null;
          employee_no: string;
          extra: Json | null;
          gender: string | null;
          id: string;
          id_number: string | null;
          join_date: string | null;
          leave_date: string | null;
          name: string;
          phone: string | null;
          position: string | null;
          role_id: string | null;
          status: string | null;
          updated_at: string;
        };
        Update: {
          address?: string | null;
          avatar_url?: string | null;
          bank_account?: string | null;
          base_salary?: number | null;
          birthday?: string | null;
          created_at?: string;
          department_id?: string | null;
          department_name?: string | null;
          email?: string | null;
          emergency_contact?: Json | null;
          employee_no?: string;
          extra?: Json | null;
          gender?: string | null;
          id?: string;
          id_number?: string | null;
          join_date?: string | null;
          leave_date?: string | null;
          name?: string;
          phone?: string | null;
          position?: string | null;
          role_id?: string | null;
          status?: string | null;
          updated_at?: string;
        };
      };
      notifications: {
        Insert: {
          content?: string | null;
          created_at?: string;
          id?: string;
          read?: boolean | null;
          title: string;
          type?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
        Row: {
          content: string | null;
          created_at: string;
          id: string;
          read: boolean | null;
          title: string;
          type: string | null;
          user_id: string | null;
        };
        Update: {
          content?: string | null;
          created_at?: string;
          id?: string;
          read?: boolean | null;
          title?: string;
          type?: string | null;
          user_id?: string | null;
        };
      };
      offboarding: {
        Insert: {
          code?: string | null;
          created_at?: string;
          employee_id?: string | null;
          employee_name: string;
          id?: string;
          last_day?: string | null;
          progress?: number | null;
          reason?: string | null;
          status?: string | null;
          steps?: Json | null;
          updated_at?: string;
        };
        Relationships: [
          {
            columns: ['employee_id'];
            foreignKeyName: 'offboarding_employee_id_fkey';
            isOneToOne: false;
            referencedColumns: ['id'];
            referencedRelation: 'employees';
          }
        ];
        Row: {
          code: string | null;
          created_at: string;
          employee_id: string | null;
          employee_name: string;
          id: string;
          last_day: string | null;
          progress: number | null;
          reason: string | null;
          status: string | null;
          steps: Json | null;
          updated_at: string;
        };
        Update: {
          code?: string | null;
          created_at?: string;
          employee_id?: string | null;
          employee_name?: string;
          id?: string;
          last_day?: string | null;
          progress?: number | null;
          reason?: string | null;
          status?: string | null;
          steps?: Json | null;
          updated_at?: string;
        };
      };
      onboarding: {
        Insert: {
          candidate_name: string;
          code?: string | null;
          created_at?: string;
          department_name?: string | null;
          employee_id?: string | null;
          id?: string;
          invite_expires_at?: string | null;
          invite_token?: string | null;
          position?: string | null;
          progress?: number | null;
          start_date?: string | null;
          status?: string | null;
          steps?: Json | null;
          updated_at?: string;
        };
        Relationships: [
          {
            columns: ['employee_id'];
            foreignKeyName: 'onboarding_employee_id_fkey';
            isOneToOne: false;
            referencedColumns: ['id'];
            referencedRelation: 'employees';
          }
        ];
        Row: {
          candidate_name: string;
          code: string | null;
          created_at: string;
          department_name: string | null;
          employee_id: string | null;
          id: string;
          invite_expires_at: string | null;
          invite_token: string | null;
          position: string | null;
          progress: number | null;
          start_date: string | null;
          status: string | null;
          steps: Json | null;
          updated_at: string;
        };
        Update: {
          candidate_name?: string;
          code?: string | null;
          created_at?: string;
          department_name?: string | null;
          employee_id?: string | null;
          id?: string;
          invite_expires_at?: string | null;
          invite_token?: string | null;
          position?: string | null;
          progress?: number | null;
          start_date?: string | null;
          status?: string | null;
          steps?: Json | null;
          updated_at?: string;
        };
      };
      payroll_calc_items: {
        Insert: {
          allowance?: number | null;
          base?: number | null;
          bonus?: number | null;
          calc_id?: string | null;
          deduction?: number | null;
          details?: Json | null;
          employee_id?: string | null;
          employee_name?: string | null;
          id?: string;
          net?: number | null;
          tax?: number | null;
        };
        Relationships: [
          {
            columns: ['calc_id'];
            foreignKeyName: 'payroll_calc_items_calc_id_fkey';
            isOneToOne: false;
            referencedColumns: ['id'];
            referencedRelation: 'payroll_calculations';
          },
          {
            columns: ['employee_id'];
            foreignKeyName: 'payroll_calc_items_employee_id_fkey';
            isOneToOne: false;
            referencedColumns: ['id'];
            referencedRelation: 'employees';
          }
        ];
        Row: {
          allowance: number | null;
          base: number | null;
          bonus: number | null;
          calc_id: string | null;
          deduction: number | null;
          details: Json | null;
          employee_id: string | null;
          employee_name: string | null;
          id: string;
          net: number | null;
          tax: number | null;
        };
        Update: {
          allowance?: number | null;
          base?: number | null;
          bonus?: number | null;
          calc_id?: string | null;
          deduction?: number | null;
          details?: Json | null;
          employee_id?: string | null;
          employee_name?: string | null;
          id?: string;
          net?: number | null;
          tax?: number | null;
        };
      };
      payroll_calculations: {
        Insert: {
          code?: string | null;
          created_at?: string;
          employee_count?: number | null;
          id?: string;
          period: string;
          remark?: string | null;
          status?: string | null;
          total_amount?: number | null;
          updated_at?: string;
        };
        Relationships: [];
        Row: {
          code: string | null;
          created_at: string;
          employee_count: number | null;
          id: string;
          period: string;
          remark: string | null;
          status: string | null;
          total_amount: number | null;
          updated_at: string;
        };
        Update: {
          code?: string | null;
          created_at?: string;
          employee_count?: number | null;
          id?: string;
          period?: string;
          remark?: string | null;
          status?: string | null;
          total_amount?: number | null;
          updated_at?: string;
        };
      };
      payroll_dist_items: {
        Insert: {
          amount?: number | null;
          bank_account?: string | null;
          dist_id?: string | null;
          employee_id?: string | null;
          employee_name?: string | null;
          id?: string;
          status?: string | null;
        };
        Relationships: [
          {
            columns: ['dist_id'];
            foreignKeyName: 'payroll_dist_items_dist_id_fkey';
            isOneToOne: false;
            referencedColumns: ['id'];
            referencedRelation: 'payroll_distributions';
          },
          {
            columns: ['employee_id'];
            foreignKeyName: 'payroll_dist_items_employee_id_fkey';
            isOneToOne: false;
            referencedColumns: ['id'];
            referencedRelation: 'employees';
          }
        ];
        Row: {
          amount: number | null;
          bank_account: string | null;
          dist_id: string | null;
          employee_id: string | null;
          employee_name: string | null;
          id: string;
          status: string | null;
        };
        Update: {
          amount?: number | null;
          bank_account?: string | null;
          dist_id?: string | null;
          employee_id?: string | null;
          employee_name?: string | null;
          id?: string;
          status?: string | null;
        };
      };
      payroll_distributions: {
        Insert: {
          code?: string | null;
          created_at?: string;
          employee_count?: number | null;
          id?: string;
          method?: string | null;
          paid_at?: string | null;
          period: string;
          status?: string | null;
          total_amount?: number | null;
          updated_at?: string;
        };
        Relationships: [];
        Row: {
          code: string | null;
          created_at: string;
          employee_count: number | null;
          id: string;
          method: string | null;
          paid_at: string | null;
          period: string;
          status: string | null;
          total_amount: number | null;
          updated_at: string;
        };
        Update: {
          code?: string | null;
          created_at?: string;
          employee_count?: number | null;
          id?: string;
          method?: string | null;
          paid_at?: string | null;
          period?: string;
          status?: string | null;
          total_amount?: number | null;
          updated_at?: string;
        };
      };
      payroll_plans: {
        Insert: {
          allowances?: Json | null;
          base_salary?: number | null;
          code?: string | null;
          created_at?: string;
          deductions?: Json | null;
          description?: string | null;
          effective_date?: string | null;
          id?: string;
          name: string;
          status?: string | null;
          updated_at?: string;
        };
        Relationships: [];
        Row: {
          allowances: Json | null;
          base_salary: number | null;
          code: string | null;
          created_at: string;
          deductions: Json | null;
          description: string | null;
          effective_date: string | null;
          id: string;
          name: string;
          status: string | null;
          updated_at: string;
        };
        Update: {
          allowances?: Json | null;
          base_salary?: number | null;
          code?: string | null;
          created_at?: string;
          deductions?: Json | null;
          description?: string | null;
          effective_date?: string | null;
          id?: string;
          name?: string;
          status?: string | null;
          updated_at?: string;
        };
      };
      performance_evaluations: {
        Insert: {
          code?: string | null;
          created_at?: string;
          cycle?: string | null;
          department_name?: string | null;
          details?: Json | null;
          employee_id?: string | null;
          employee_name?: string | null;
          final_score?: number | null;
          grade?: string | null;
          id?: string;
          manager_score?: number | null;
          peer_score?: number | null;
          plan_id?: string | null;
          plan_name?: string | null;
          position?: string | null;
          self_score?: number | null;
          status?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            columns: ['employee_id'];
            foreignKeyName: 'performance_evaluations_employee_id_fkey';
            isOneToOne: false;
            referencedColumns: ['id'];
            referencedRelation: 'employees';
          },
          {
            columns: ['plan_id'];
            foreignKeyName: 'performance_evaluations_plan_id_fkey';
            isOneToOne: false;
            referencedColumns: ['id'];
            referencedRelation: 'performance_plans';
          }
        ];
        Row: {
          code: string | null;
          created_at: string;
          cycle: string | null;
          department_name: string | null;
          details: Json | null;
          employee_id: string | null;
          employee_name: string | null;
          final_score: number | null;
          grade: string | null;
          id: string;
          manager_score: number | null;
          peer_score: number | null;
          plan_id: string | null;
          plan_name: string | null;
          position: string | null;
          self_score: number | null;
          status: string | null;
          updated_at: string;
        };
        Update: {
          code?: string | null;
          created_at?: string;
          cycle?: string | null;
          department_name?: string | null;
          details?: Json | null;
          employee_id?: string | null;
          employee_name?: string | null;
          final_score?: number | null;
          grade?: string | null;
          id?: string;
          manager_score?: number | null;
          peer_score?: number | null;
          plan_id?: string | null;
          plan_name?: string | null;
          position?: string | null;
          self_score?: number | null;
          status?: string | null;
          updated_at?: string;
        };
      };
      performance_plans: {
        Insert: {
          code?: string | null;
          created_at?: string;
          cycle?: string | null;
          description?: string | null;
          id?: string;
          kpi_template?: Json | null;
          name: string;
          status?: string | null;
          updated_at?: string;
          weights?: Json | null;
        };
        Relationships: [];
        Row: {
          code: string | null;
          created_at: string;
          cycle: string | null;
          description: string | null;
          id: string;
          kpi_template: Json | null;
          name: string;
          status: string | null;
          updated_at: string;
          weights: Json | null;
        };
        Update: {
          code?: string | null;
          created_at?: string;
          cycle?: string | null;
          description?: string | null;
          id?: string;
          kpi_template?: Json | null;
          name?: string;
          status?: string | null;
          updated_at?: string;
          weights?: Json | null;
        };
      };
      roles: {
        Insert: {
          code?: string | null;
          created_at?: string;
          department_id?: string | null;
          description?: string | null;
          id?: string;
          level?: string | null;
          member_count?: number | null;
          permissions?: Json | null;
          title: string;
          updated_at?: string;
        };
        Relationships: [
          {
            columns: ['department_id'];
            foreignKeyName: 'roles_department_id_fkey';
            isOneToOne: false;
            referencedColumns: ['id'];
            referencedRelation: 'departments';
          }
        ];
        Row: {
          code: string | null;
          created_at: string;
          department_id: string | null;
          description: string | null;
          id: string;
          level: string | null;
          member_count: number | null;
          permissions: Json | null;
          title: string;
          updated_at: string;
        };
        Update: {
          code?: string | null;
          created_at?: string;
          department_id?: string | null;
          description?: string | null;
          id?: string;
          level?: string | null;
          member_count?: number | null;
          permissions?: Json | null;
          title?: string;
          updated_at?: string;
        };
      };
      training_plans: {
        Insert: {
          code?: string | null;
          created_at?: string;
          description?: string | null;
          duration_hours?: number | null;
          id?: string;
          modules?: Json | null;
          name: string;
          required?: boolean | null;
          status?: string | null;
          target?: Json | null;
          type?: string | null;
          updated_at?: string;
        };
        Relationships: [];
        Row: {
          code: string | null;
          created_at: string;
          description: string | null;
          duration_hours: number | null;
          id: string;
          modules: Json | null;
          name: string;
          required: boolean | null;
          status: string | null;
          target: Json | null;
          type: string | null;
          updated_at: string;
        };
        Update: {
          code?: string | null;
          created_at?: string;
          description?: string | null;
          duration_hours?: number | null;
          id?: string;
          modules?: Json | null;
          name?: string;
          required?: boolean | null;
          status?: string | null;
          target?: Json | null;
          type?: string | null;
          updated_at?: string;
        };
      };
      training_records: {
        Insert: {
          completed_at?: string | null;
          created_at?: string;
          department_name?: string | null;
          employee_id?: string | null;
          employee_name?: string | null;
          id?: string;
          plan_id?: string | null;
          plan_name?: string | null;
          progress?: number | null;
          score?: number | null;
          status?: string | null;
        };
        Relationships: [
          {
            columns: ['employee_id'];
            foreignKeyName: 'training_records_employee_id_fkey';
            isOneToOne: false;
            referencedColumns: ['id'];
            referencedRelation: 'employees';
          },
          {
            columns: ['plan_id'];
            foreignKeyName: 'training_records_plan_id_fkey';
            isOneToOne: false;
            referencedColumns: ['id'];
            referencedRelation: 'training_plans';
          }
        ];
        Row: {
          completed_at: string | null;
          created_at: string;
          department_name: string | null;
          employee_id: string | null;
          employee_name: string | null;
          id: string;
          plan_id: string | null;
          plan_name: string | null;
          progress: number | null;
          score: number | null;
          status: string | null;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string;
          department_name?: string | null;
          employee_id?: string | null;
          employee_name?: string | null;
          id?: string;
          plan_id?: string | null;
          plan_name?: string | null;
          progress?: number | null;
          score?: number | null;
          status?: string | null;
        };
      };
      user_roles: {
        Insert: {
          id?: string;
          role: Database['public']['Enums']['app_role'];
          user_id: string;
        };
        Relationships: [];
        Row: {
          id: string;
          role: Database['public']['Enums']['app_role'];
          user_id: string;
        };
        Update: {
          id?: string;
          role?: Database['public']['Enums']['app_role'];
          user_id?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ['admin', 'hr', 'manager', 'employee']
    }
  }
} as const;
