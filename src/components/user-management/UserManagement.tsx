import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Plus, Mail, User, Building2, MapPin, Trash2, Edit, Search, X, Shield } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import * as XLSX from 'xlsx';
import { useAutoSave } from "@/hooks/useAutoSave";
import { userFormSchema, type UserFormInput } from "@/lib/validation/schemas";
import { safeValidate } from "@/lib/validation/utils";
import { logger } from "@/lib/logger";

interface UserManagementRecord {
  id: string;
  user_id: string;
  username: string;
  email: string;
  associated_clients: string[];
  associated_branches: string[];
  status: 'active' | 'inactive' | 'pending';
  role: 'admin' | 'manager' | 'client';
  created_by: string;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

interface UserForm {
  username: string;
  email: string;
  associated_client_branches: string[]; // Changed to client-branch combinations
  role: 'admin' | 'manager' | 'client';
}

const UserManagement = () => {
  const { user: authUser, profile } = useAuth();
  const [userForm, setUserForm] = useState<UserForm>({
    username: '',
    email: '',
    associated_client_branches: [],
    role: 'client'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [clientBranchSearch, setClientBranchSearch] = useState('');

  // Auto-save form data to prevent data loss
  const { loadData, clearSavedData } = useAutoSave({
    storageKey: 'user_management_form_autosave',
    data: userForm,
    enabled: !editingUserId, // Disable auto-save when editing
    debounceDelay: 2000,
    onLoad: (savedData) => {
      // Only restore if we're not currently editing and form is empty
      if (savedData && !editingUserId && !userForm.username && !userForm.email) {
        setUserForm(savedData);
        toast({
          title: "Form data restored",
          description: "Your previous form data has been restored.",
        });
      }
    },
  });

  // Load saved data on mount (only if not editing and form is empty)
  useEffect(() => {
    if (!editingUserId && !userForm.username && !userForm.email) {
      const saved = loadData();
      if (saved && saved.username && saved.email) {
        // Only restore if there's actual saved data
        setUserForm(saved);
      }
    }
  }, []); // Only run on mount
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<keyof UserManagementRecord | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filters, setFilters] = useState({
    username: '',
    email: '',
    role: 'all',
    status: 'all'
  });
  const queryClient = useQueryClient();

  // Fetch user management records
  const { data: userRecords, isLoading } = useQuery({
    queryKey: ["user-management"],
    queryFn: async () => {
      console.log('Fetching user management records...');
      const { data, error } = await supabase
        .from("user_management")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) {
        console.error('Error fetching user management records:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error details:', error.details);
        if (error.code === 'PGRST116' || error.message?.includes('relation "user_management" does not exist')) {
          console.warn('Table does not exist or is empty');
          return []; // Return empty array if table doesn't exist
        }
        // Don't throw error, return empty array to show helpful message
        console.warn('Query failed, returning empty array');
        return [];
      }
      console.log('User records fetched:', data?.length || 0, 'users');
      return (data || []) as UserManagementRecord[];
    },
  });

  // Fetch available clients and branches
  const { data: customers } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("client_name, branch")
        .eq("is_active", true)
        .order("client_name", { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  // Get unique client-branch combinations
  const getUniqueClientBranches = () => {
    if (!customers) return [];
    const combinations = customers
      .filter(c => c.client_name && c.branch)
      .map(c => `${c.client_name} - ${c.branch}`)
      .filter(Boolean);
    return [...new Set(combinations)].sort();
  };

  // Get filtered client-branch combinations based on search
  const getFilteredClientBranches = () => {
    const allCombinations = getUniqueClientBranches();
    if (!clientBranchSearch.trim()) return allCombinations;
    
    return allCombinations.filter(combination => 
      combination.toLowerCase().includes(clientBranchSearch.toLowerCase())
    );
  };

  // Generate temporary password
  const generateTemporaryPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Sorting and filtering functions
  const handleSort = (field: keyof UserManagementRecord) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortedAndFilteredUsers = () => {
    if (!userRecords) {
      return [];
    }
    const filtered = userRecords.filter(user => {
      const matchesUsername = !filters.username || 
        user.username.toLowerCase().includes(filters.username.toLowerCase());
      const matchesEmail = !filters.email || 
        user.email.toLowerCase().includes(filters.email.toLowerCase());
      const matchesRole = !filters.role || filters.role === 'all' || user.role === filters.role;
      const matchesStatus = !filters.status || filters.status === 'all' || user.status === filters.status;

      return matchesUsername && matchesEmail && matchesRole && matchesStatus;
    });

    if (sortField) {
      filtered.sort((a, b) => {
        let aValue = a[sortField];
        let bValue = b[sortField];

        // Handle array fields
        if (Array.isArray(aValue)) {
          aValue = aValue.length;
        }
        if (Array.isArray(bValue)) {
          bValue = bValue.length;
        }

        // Handle null/undefined values
        if (aValue === null || aValue === undefined) aValue = '';
        if (bValue === null || bValue === undefined) bValue = '';

        // Convert to strings for comparison
        const aStr = String(aValue).toLowerCase();
        const bStr = String(bValue).toLowerCase();

        if (sortDirection === 'asc') {
          return aStr < bStr ? -1 : aStr > bStr ? 1 : 0;
        } else {
          return aStr > bStr ? -1 : aStr < bStr ? 1 : 0;
        }
      });
    }

    return filtered;
  };

  const clearFilters = () => {
    setFilters({
      username: '',
      email: '',
      role: 'all',
      status: 'all'
    });
  };

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (formData: UserForm) => {
      // Note: The Edge Function will handle checking and deleting existing users
      // We don't need to check here - let the Edge Function handle it
      console.log('Creating user - Edge Function will handle existing user cleanup');

      // Use direct database approach with proper error handling (updated)
      console.log('Using direct database approach for user creation');
      const tempPassword = generateTemporaryPassword();

      // For admin/manager roles, automatically assign all clients
      let associatedClients: string[];
      let associatedBranches: string[];

      if (formData.role === 'admin' || formData.role === 'manager') {
        // Get all clients and branches for admin/manager roles
        try {
          const { data: allClients, error: clientsError } = await supabase
            .from('customers')
            .select('client_name, branch')
            .not('client_name', 'is', null)
            .not('client_name', 'eq', '')
            .not('branch', 'is', null)
            .not('branch', 'eq', '');

          if (clientsError) {
            console.warn('Error fetching all clients for admin/manager:', clientsError);
            // For admin/manager, empty arrays are acceptable - they'll get access to all clients automatically
            associatedClients = [];
            associatedBranches = [];
          } else if (allClients && allClients.length > 0) {
            associatedClients = [...new Set(allClients.map(c => c.client_name).filter(Boolean))];
            associatedBranches = [...new Set(allClients.map(c => c.branch).filter(Boolean))];
            console.log('Found clients for admin/manager:', associatedClients.length, 'clients');
          } else {
            console.log('No clients found in database - admin/manager will have empty access initially');
            // Empty arrays are fine - admin/manager roles will get access to all clients as they're added
            associatedClients = [];
            associatedBranches = [];
          }
        } catch (error) {
          console.error('Exception fetching clients for admin/manager:', error);
          // Empty arrays are acceptable for admin/manager
          associatedClients = [];
          associatedBranches = [];
        }
      } else {
        // For client roles, use the selected client-branch combinations
        // Parse "Client - Branch" format safely
        associatedClients = formData.associated_client_branches
          .map(combo => {
            const parts = combo.split(' - ');
            return parts[0]?.trim() || '';
          })
          .filter(Boolean);
        
        associatedBranches = formData.associated_client_branches
          .map(combo => {
            const parts = combo.split(' - ');
            return parts[1]?.trim() || 'All Branches';
          })
          .filter(Boolean);
        
        // Ensure arrays are the same length
        const maxLength = Math.max(associatedClients.length, associatedBranches.length);
        while (associatedClients.length < maxLength) {
          associatedClients.push('');
        }
        while (associatedBranches.length < maxLength) {
          associatedBranches.push('All Branches');
        }
      }

      // Check if user is authenticated using AuthContext (works with mock auth)
      const user = authUser;
      console.log('Current user from AuthContext:', user);
      
      if (!user) {
        throw new Error('User not authenticated. Please log in again.');
      }

      // Check if current user exists in user_management table
      // Note: This might fail with RLS in development, so we'll handle errors gracefully
      let currentUserRecord = null;
      try {
        const { data, error: currentUserError } = await supabase
          .from('user_management')
          .select('id')
          .eq('user_id', user.id)
          .single();
        
        if (!currentUserError) {
          currentUserRecord = data;
        } else if (currentUserError.code !== 'PGRST116') {
          console.warn('Current user not found in user_management:', currentUserError);
        }
      } catch (error) {
        console.warn('Could not fetch current user record (may be due to RLS):', error);
        // Continue without currentUserRecord - Edge Function will handle it
      }

      console.log('Current user record in user_management:', currentUserRecord);
      console.log('Creating user with role:', formData.role);
      console.log('Role type:', typeof formData.role);
      console.log('Role value:', JSON.stringify(formData.role));
      console.log('Associated clients:', associatedClients);
      console.log('Associated branches:', associatedBranches);

      // Validate role before sending
      if (!formData.role || !['admin', 'manager', 'client'].includes(formData.role)) {
        throw new Error(`Invalid role: ${formData.role}. Role must be one of: admin, manager, client`);
      }

      // Create user using server-side function to skip email confirmation
      const requestBody = {
        email: formData.email,
        username: formData.username,
        password: tempPassword,
        role: formData.role, // Ensure role is explicitly set
        associatedClients: associatedClients,
        associatedBranches: associatedBranches,
        createdBy: currentUserRecord?.id || null
      };
      
      console.log('Sending request to create-user function:', { 
        ...requestBody, 
        password: '***',
        roleType: typeof requestBody.role,
        roleValue: requestBody.role
      });
      
      const { data: createUserResponse, error: createUserError } = await supabase.functions.invoke('create-user', {
        body: requestBody
      });

      if (createUserError) {
        console.error('Create user function error:', createUserError);
        throw new Error(`Failed to create user: ${createUserError.message}`);
      }

      if (!createUserResponse || !createUserResponse.success) {
        throw new Error(`Failed to create user: ${createUserResponse?.error || 'Unknown error'}`);
      }

      console.log('User created successfully via function:', createUserResponse.data);
      const userRecord = createUserResponse.data.user;

      // Send welcome email
      try {
        const { error: emailError } = await supabase.functions.invoke('send-welcome-email-resend', {
          body: {
            email: formData.email,
            username: formData.username,
            tempPassword: tempPassword,
            appUrl: window.location.origin
          }
        });

        if (emailError) {
          console.warn('Failed to send welcome email:', emailError);
        } else {
          console.log('Welcome email sent successfully');
        }
      } catch (emailError) {
        console.warn('Email sending failed:', emailError);
      }

      console.log('User created successfully:', userRecord);
      console.log('Created user role:', userRecord?.role);
      console.log('Expected role was:', formData.role);
      
      // Verify the role matches what was requested
      if (userRecord?.role !== formData.role) {
        console.error('ROLE MISMATCH! Expected:', formData.role, 'Got:', userRecord?.role);
      }
      
      return userRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-management"] });
      setUserForm({
        username: '',
        email: '',
        associated_client_branches: [],
        role: 'client'
      });
      clearSavedData(); // Clear auto-saved data after successful submission
      toast({
        title: "Success",
        description: "User created successfully. Welcome email has been sent automatically.",
      });
    },
    onError: (error: unknown) => {
      console.error('User creation error:', error);
      let errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Provide more helpful error messages
      if (typeof errorMessage === 'string' && errorMessage.includes('already exists')) {
        errorMessage = `User with this email already exists. Please delete the existing user first or use a different email.`;
      } else if (typeof errorMessage === 'string' && errorMessage.includes('foreign key constraint')) {
        errorMessage = `Database constraint error. Please try again or contact support.`;
      } else if (typeof errorMessage === 'string' && errorMessage.includes('Failed to create user account')) {
        errorMessage = `Failed to create user account. The email might already be in use. Please try a different email.`;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      // First, try to use the Edge Function if available
      try {
        const { data, error } = await supabase.functions.invoke('delete-user', {
          body: { userId }
        });

        if (error) throw error;

        // If the function returns an error, throw it
        if (data && data.error) {
          throw new Error(data.error);
        }

        return data;
      } catch (edgeFunctionError) {
        // Fallback: Only delete from user_management table
        console.warn('Edge Function not available, using fallback deletion:', edgeFunctionError);
        
        // First, get the user's email to use for deletion
        const { data: userData, error: fetchError } = await supabase
          .from('user_management')
          .select('email, username, role')
          .eq('user_id', userId)
          .single();
        
        if (fetchError) {
          console.error('Error fetching user data:', fetchError);
          throw fetchError;
        }
        
        const { error, count: initialCount } = await supabase
          .from('user_management')
          .delete({ count: 'exact' })
          .eq('user_id', userId);
        let count = initialCount;

        // If no rows were affected by user_id, try deleting by email
        if (count === 0) {
          const { error: emailError, count: emailCount } = await supabase
            .from('user_management')
            .delete({ count: 'exact' })
            .eq('email', userData.email);
          
          if (emailError) {
            console.error('Error deleting by email:', emailError);
            throw emailError;
          }
          
          count = emailCount;
        }

        if (error) {
          console.error('Error deleting from user_management:', error);
          throw error;
        }

        if (count === 0) {
          // Check if user was already deleted by checking if it still exists
          const { data: userStillExists, error: checkError } = await supabase
            .from('user_management')
            .select('id')
            .eq('user_id', userId)
            .single();
          
          
          if (!userStillExists && !checkError) {
            return { success: true, message: 'User was already deleted' };
          } else if (userStillExists) {
            // User still exists but couldn't be deleted - likely RLS issue
            console.error('User still exists but deletion failed - likely RLS policy issue');
            throw new Error('Cannot delete user. You may not have permission to delete this user due to Row Level Security policies.');
          } else {
            throw new Error('No rows were deleted. User may not exist or you may not have permission.');
          }
        }

        return { success: true, message: 'User deleted from user management (auth deletion requires Edge Function)' };
      }
    },
    onSuccess: async (data) => {
      
      // Clear the deleting user ID first
      const deletedUserId = deletingUserId;
      setDeletingUserId(null);
      
      // Force refresh the user management data
      await queryClient.invalidateQueries({ queryKey: ["user-management"] });
      await queryClient.refetchQueries({ queryKey: ["user-management"] });
      
      // Force a complete reset of the query
      queryClient.removeQueries({ queryKey: ["user-management"] });
      
      // Trigger a new query
      queryClient.prefetchQuery({
        queryKey: ["user-management"],
        queryFn: async () => {
          const { data, error } = await supabase
            .from("user_management")
            .select("*")
            .order("created_at", { ascending: false });
          
          if (error) {
            console.error('Error fetching user management records:', error);
            if (error.code === 'PGRST116' || error.message.includes('relation "user_management" does not exist')) {
              return [];
            }
            throw error;
          }
          return data as UserManagementRecord[];
        },
      });
      
      // Also remove the specific user from cache as backup
      queryClient.setQueryData(["user-management"], (oldData: UserManagementRecord[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.filter(user => user.user_id !== deletedUserId);
      });
      
      toast({
        title: "Success",
        description: data?.message || "User deleted successfully.",
      });
      
      // Force a final refresh after a short delay
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["user-management"] });
      }, 100);
    },
    onError: (error: unknown) => {
      toast({
        title: "Error",
        description: `Failed to delete user: ${error instanceof Error ? error.message : ''}`,
        variant: "destructive",
      });
    },
  });

  // Update user status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: string }) => {
      const { error } = await supabase
        .from("user_management")
        .update({ status })
        .eq("user_id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-management"] });
      toast({
        title: "Success",
        description: "User status updated successfully.",
      });
    },
    onError: (error: unknown) => {
      toast({
        title: "Error",
        description: `Failed to update user status: ${error instanceof Error ? error.message : ''}`,
        variant: "destructive",
      });
    },
  });

  // Update user details mutation (for managers)
  const updateUserMutation = useMutation({
    mutationFn: async ({ 
      userId, 
      username, 
      email, 
      role, 
      associated_client_branches 
    }: { 
      userId: string; 
      username: string; 
      email: string; 
      role: string; 
      associated_client_branches: string[] 
    }) => {
      // For admin/manager roles, automatically assign all clients
      let associatedClients: string[];
      let associatedBranches: string[];

      if (role === 'admin' || role === 'manager') {
        // Get all clients and branches for admin/manager roles
        const { data: allClients } = await supabase
          .from('customers')
          .select('client_name, branch')
          .not('client_name', 'is', null)
          .not('client_name', 'eq', '')
          .not('branch', 'is', null)
          .not('branch', 'eq', '');

        if (allClients) {
          associatedClients = [...new Set(allClients.map(c => c.client_name).filter(Boolean))];
          associatedBranches = [...new Set(allClients.map(c => c.branch).filter(Boolean))];
        } else {
          associatedClients = [];
          associatedBranches = [];
        }
      } else {
        // For client roles, use the selected client-branch combinations
        // Parse "Client - Branch" format safely
        associatedClients = associated_client_branches
          .map(combo => {
            const parts = combo.split(' - ');
            return parts[0]?.trim() || '';
          })
          .filter(Boolean);
        
        associatedBranches = associated_client_branches
          .map(combo => {
            const parts = combo.split(' - ');
            return parts[1]?.trim() || 'All Branches';
          })
          .filter(Boolean);
        
        // Ensure arrays are the same length
        const maxLength = Math.max(associatedClients.length, associatedBranches.length);
        while (associatedClients.length < maxLength) {
          associatedClients.push('');
        }
        while (associatedBranches.length < maxLength) {
          associatedBranches.push('All Branches');
        }
      }

      const { error } = await supabase
        .from("user_management")
        .update({ 
          username,
          email,
          role,
          associated_clients: associatedClients,
          associated_branches: associatedBranches,
          updated_at: new Date().toISOString()
        })
        .eq("user_id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-management"] });
      clearSavedData(); // Clear auto-saved data after successful update
      toast({
        title: "Success",
        description: "User details updated successfully.",
      });
    },
    onError: (error: unknown) => {
      toast({
        title: "Error",
        description: `Failed to update user details: ${error instanceof Error ? error.message : ''}`,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    // Prevent default form submission
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    
    logger.debug('Form submission started', { userForm });
    
    // Prevent double submission
    if (isSubmitting) {
      logger.warn('Form is already submitting, ignoring duplicate submission');
      return;
    }
    
    // Validate form data using Zod schema
    const validationResult = safeValidate(userFormSchema, userForm);
    if (!validationResult.success) {
      logger.error('Validation failed:', validationResult.error);
      toast({
        title: "Validation Error",
        description: validationResult.error,
        variant: "destructive",
      });
      return;
    }

    logger.debug('Validation passed, submitting form', { role: userForm.role });
    setIsSubmitting(true);
    
    try {
      if (editingUserId) {
        // Update existing user
        console.log('Updating user:', editingUserId);
        await updateUserMutation.mutateAsync({
          userId: editingUserId,
          username: userForm.username,
          email: userForm.email,
          role: userForm.role,
          associated_client_branches: userForm.associated_client_branches
        });
        setEditingUserId(null);
        console.log('User updated successfully');
      } else {
        // Create new user
        console.log('Creating new user with role:', userForm.role);
        await createUserMutation.mutateAsync(userForm);
        console.log('User created successfully');
      }
      
      // Reset form only on success
      setUserForm({
        username: '',
        email: '',
        associated_client_branches: [],
        role: 'client'
      });
      clearSavedData(); // Clear auto-saved data after successful submission
    } catch (error) {
      logger.error('Form submission error:', error);
      // Error handling is done in the mutation onError callbacks
      // Don't reset form on error so user can correct and retry
    } finally {
      setIsSubmitting(false);
      logger.debug('Form submission completed');
    }
  };

  const handleClientBranchToggle = (clientBranch: string) => {
    setUserForm(prev => ({
      ...prev,
      associated_client_branches: prev.associated_client_branches.includes(clientBranch)
        ? prev.associated_client_branches.filter(cb => cb !== clientBranch)
        : [...prev.associated_client_branches, clientBranch]
    }));
  };

  const handleSelectAllFiltered = () => {
    const filteredCombinations = getFilteredClientBranches();
    const newSelections = [...new Set([...userForm.associated_client_branches, ...filteredCombinations])];
    setUserForm(prev => ({
      ...prev,
      associated_client_branches: newSelections
    }));
  };

  const handleDeselectAllFiltered = () => {
    const filteredCombinations = getFilteredClientBranches();
    const newSelections = userForm.associated_client_branches.filter(cb => !filteredCombinations.includes(cb));
    setUserForm(prev => ({
      ...prev,
      associated_client_branches: newSelections
    }));
  };

  const exportToExcel = () => {
    const filteredUsers = getSortedAndFilteredUsers();
    if (!filteredUsers.length) return;

    const exportData = filteredUsers.map(record => ({
      Username: record.username,
      Email: record.email,
      Role: record.role,
      'Client-Branch Access': record.associated_clients && record.associated_clients.length > 0 ? 
        record.associated_clients.map((client, idx) => {
          const branch = record.associated_branches && record.associated_branches[idx] ? record.associated_branches[idx] : 'All Branches';
          return `${client} - ${branch}`;
        }).join('; ') : 'No access assigned',
      Status: record.status,
      'Created On': record.created_at ? new Date(record.created_at).toLocaleDateString() : 'N/A',
      'Created By': record.created_by ? record.created_by.substring(0, 8) + '...' : 'N/A',
      'Last Login': record.last_login ? new Date(record.last_login).toLocaleDateString() : 'Never'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "User Management");
    XLSX.writeFile(wb, `user_management_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const toggleExpanded = (userId: string) => {
    setExpandedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const renderClientBranchAccess = (user: UserManagementRecord) => {
    // For admin/manager roles, show "All Clients" if they have access to all
    if (user.role === 'admin' || user.role === 'manager') {
      // Check if they have all available clients (or a large number indicating all access)
      const allClientBranches = getUniqueClientBranches();
      const hasAllAccess = allClientBranches.length > 0 && 
        (user.associated_clients?.length || 0) >= allClientBranches.length;
      
      if (hasAllAccess || (user.associated_clients?.length || 0) > 5) {
        return (
          <Badge variant="secondary" className="text-xs px-1 py-0 bg-blue-100 text-blue-800">
            All Clients & Branches
          </Badge>
        );
      }
    }
    
    const clientBranches = user.associated_clients && user.associated_clients.length > 0 ? 
      user.associated_clients.map((client, idx) => {
        const branch = user.associated_branches && user.associated_branches[idx] ? user.associated_branches[idx] : 'All';
        return `${client}-${branch}`;
      }) : [];

    if (clientBranches.length === 0) {
      return (
        <Badge variant="outline" className="text-xs text-gray-500 px-1 py-0">
          No access
        </Badge>
      );
    }

    const isExpanded = expandedUsers.has(user.user_id);
    const displayBranches = isExpanded ? clientBranches : clientBranches.slice(0, 2);
    const hasMore = clientBranches.length > 2;

    return (
      <div className="flex items-center gap-1 flex-wrap">
        {displayBranches.map((combo, idx) => (
          <Badge key={idx} variant="secondary" className="text-xs px-1 py-0">
            {combo}
          </Badge>
        ))}
        {hasMore && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => toggleExpanded(user.user_id)}
            className="h-5 px-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full"
          >
            {isExpanded ? 'Less' : `+${clientBranches.length - 2}`}
          </Button>
        )}
      </div>
    );
  };

  // Role-based access control - only managers and admins can access
  if (profile?.role !== 'manager' && profile?.role !== 'admin') {
    return (
      <Alert className="m-6" variant="destructive">
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Access denied. This page is only available to users with Manager or Admin role.
          Your current role: {profile?.role || 'Unknown'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage user access and permissions</p>
        </div>
        <div className="flex space-x-2">
          <Button 
            onClick={async () => {
              await queryClient.invalidateQueries({ queryKey: ["user-management"] });
              await queryClient.refetchQueries({ queryKey: ["user-management"] });
              queryClient.removeQueries({ queryKey: ["user-management"] });
            }} 
            variant="outline"
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            🔄 Refresh
          </Button>
          <Button onClick={exportToExcel} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Export to Excel
          </Button>
        </div>
      </div>

      {/* Create User Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>{editingUserId ? 'Edit User' : 'Create New User'}</span>
          </CardTitle>
          <CardDescription>
            {editingUserId ? 'Update user account and access permissions' : 'Create a new user account with specific client and branch access. Login credentials will be sent via email.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form 
            id="create-user-form" 
            onSubmit={async (e) => {
              console.log('Form onSubmit triggered');
              e.preventDefault();
              e.stopPropagation();
              await handleSubmit(e);
            }} 
            className="space-y-6"
            noValidate
            style={{ pointerEvents: 'auto' }}
            onFocus={(e) => {
              console.log('Form focused:', e.target);
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  value={userForm.username || ''}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    console.log('Username input changed:', newValue);
                    setUserForm(prev => ({ ...prev, username: newValue }));
                  }}
                  placeholder="Enter username"
                  required
                  disabled={isSubmitting}
                  autoComplete="username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={userForm.email || ''}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    console.log('Email input changed:', newValue);
                    setUserForm(prev => {
                      const updated = { ...prev, email: newValue };
                      console.log('Updated userForm with email:', updated);
                      return updated;
                    });
                  }}
                  onInput={(e) => {
                    console.log('Email input event:', e.currentTarget.value);
                  }}
                  placeholder="Enter email address"
                  required
                  disabled={isSubmitting}
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Select
                  value={userForm.role || 'client'}
                  onValueChange={(value: 'admin' | 'manager' | 'client') => {
                    console.log('Role changed to:', value);
                    setUserForm(prev => {
                      const updated = { ...prev, role: value };
                      console.log('Updated userForm with role:', updated);
                      // Clear client-branch selections when switching to admin/manager
                      if (value === 'admin' || value === 'manager') {
                        updated.associated_client_branches = [];
                      }
                      return updated;
                    });
                  }}
                  disabled={isSubmitting}
                >
                  <SelectTrigger 
                    id="role-select" 
                    aria-label="Select user role"
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin" key="admin">Admin</SelectItem>
                    <SelectItem value="manager" key="manager">Manager</SelectItem>
                    <SelectItem value="client" key="client">Client</SelectItem>
                  </SelectContent>
                </Select>
                {userForm.role && (
                  <p className="text-xs text-gray-500 mt-1">
                    Selected role: <span className="font-semibold">{userForm.role}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Admin/Manager Auto Access Message */}
            {(userForm.role === 'admin' || userForm.role === 'manager') && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <Building2 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-blue-900">
                      Automatic Access Assignment
                    </h4>
                    <p className="text-sm text-blue-700 mt-1">
                      {userForm.role === 'admin' ? 'Admin' : 'Manager'} users automatically get access to ALL clients and branches. 
                      This access will be updated automatically when new clients are added to the system.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Label className="text-base font-medium">Client-Branch Access *</Label>
                  <span className="text-sm text-gray-500">
                    {userForm.role === 'admin' || userForm.role === 'manager' 
                      ? 'Admin/Manager users automatically get access to all clients and branches'
                      : 'Select specific client-branch combinations this user can access'
                    }
                  </span>
                </div>
                
                {/* Search Input */}
                <div className="mb-3 flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      type="text"
                      placeholder="Search client-branch combinations..."
                      value={clientBranchSearch}
                      onChange={(e) => setClientBranchSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  {clientBranchSearch && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setClientBranchSearch('')}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Clear
                    </Button>
                  )}
                </div>

                {/* Select All / Deselect All buttons */}
                {getFilteredClientBranches().length > 0 && (
                  <div className="mb-3 flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAllFiltered}
                    >
                      Select All Filtered
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleDeselectAllFiltered}
                    >
                      Deselect All Filtered
                    </Button>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto border rounded-md p-3">
                  {getFilteredClientBranches().length > 0 ? (
                    getFilteredClientBranches().map((clientBranch) => (
                      <div key={clientBranch} className="flex items-center space-x-2">
                        <Checkbox
                          id={`client-branch-${clientBranch}`}
                          checked={userForm.associated_client_branches.includes(clientBranch)}
                          onCheckedChange={() => handleClientBranchToggle(clientBranch)}
                        />
                        <Label htmlFor={`client-branch-${clientBranch}`} className="text-sm">
                          {clientBranch}
                        </Label>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 text-center text-gray-500 py-4">
                      {clientBranchSearch ? 'No matching client-branch combinations found' : 'No client-branch combinations available'}
                    </div>
                  )}
                </div>
                
                {/* Show selected count */}
                {userForm.associated_client_branches.length > 0 && (
                  <div className="mt-2 text-sm text-blue-600">
                    {userForm.associated_client_branches.length} client-branch combination(s) selected
                  </div>
                )}
              </div>
            </div>

            <div className="flex space-x-2">
              <Button 
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={(e) => {
                  // Log button click for debugging
                  console.log('Submit button clicked');
                  console.log('Current form state:', userForm);
                  console.log('Is submitting:', isSubmitting);
                  console.log('Editing user ID:', editingUserId);
                  
                  // Don't prevent default - let form submission proceed
                  // The form's onSubmit handler will be called automatically
                }}
              >
                {isSubmitting 
                  ? (editingUserId ? "Updating User..." : "Creating User...") 
                  : (editingUserId ? "Update User" : "Create User & Send Credentials")
                }
              </Button>
              {editingUserId && (
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => {
                    setEditingUserId(null);
                    setUserForm({
                      username: '',
                      email: '',
                      associated_client_branches: [],
                      role: 'client'
                    });
                  }}
                  className="px-4"
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>


      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building2 className="h-5 w-5" />
            <span>User Management</span>
          </CardTitle>
          <CardDescription>
            Manage existing users and their access permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filter Controls */}
          <div className="mb-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="filter-username" className="text-sm font-medium">Username</Label>
                <Input
                  id="filter-username"
                  placeholder="Filter by username..."
                  value={filters.username}
                  onChange={(e) => setFilters(prev => ({ ...prev, username: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="filter-email" className="text-sm font-medium">Email</Label>
                <Input
                  id="filter-email"
                  placeholder="Filter by email..."
                  value={filters.email}
                  onChange={(e) => setFilters(prev => ({ ...prev, email: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="filter-role" className="text-sm font-medium">Role</Label>
                <Select
                  value={filters.role}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, role: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="All roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="client">Client</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="filter-status" className="text-sm font-medium">Status</Label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Showing {getSortedAndFilteredUsers().length} of {userRecords?.length || 0} users
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="text-gray-600"
              >
                <X className="h-4 w-4 mr-1" />
                Clear Filters
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8">Loading users...</div>
          ) : userRecords && userRecords.length > 0 ? (
            <div className="overflow-x-auto">
              <Table className="table-fixed w-full">
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 border-b-2 border-blue-200">
                    <TableHead 
                      className="font-semibold text-blue-800 text-xs uppercase tracking-widest py-3 px-3 text-left border-r border-blue-200/50 w-32 cursor-pointer hover:bg-blue-100 transition-colors"
                      onClick={() => handleSort('username')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Username</span>
                        {sortField === 'username' && (
                          <span className="text-blue-600">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="font-semibold text-blue-800 text-xs uppercase tracking-widest py-3 px-3 text-left border-r border-blue-200/50 w-48 cursor-pointer hover:bg-blue-100 transition-colors"
                      onClick={() => handleSort('email')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Email</span>
                        {sortField === 'email' && (
                          <span className="text-blue-600">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="font-semibold text-blue-800 text-xs uppercase tracking-widest py-3 px-3 text-center border-r border-blue-200/50 w-20 cursor-pointer hover:bg-blue-100 transition-colors"
                      onClick={() => handleSort('role')}
                    >
                      <div className="flex items-center justify-center space-x-1">
                        <span>Role</span>
                        {sortField === 'role' && (
                          <span className="text-blue-600">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="font-semibold text-blue-800 text-xs uppercase tracking-widest py-3 px-3 text-left border-r border-blue-200/50 w-64 cursor-pointer hover:bg-blue-100 transition-colors"
                      onClick={() => handleSort('associated_clients')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Client-Branch Access</span>
                        {sortField === 'associated_clients' && (
                          <span className="text-blue-600">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="font-semibold text-blue-800 text-xs uppercase tracking-widest py-3 px-3 text-center border-r border-blue-200/50 w-20 cursor-pointer hover:bg-blue-100 transition-colors"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center justify-center space-x-1">
                        <span>Status</span>
                        {sortField === 'status' && (
                          <span className="text-blue-600">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="font-semibold text-blue-800 text-xs uppercase tracking-widest py-3 px-3 text-center border-r border-blue-200/50 w-24 cursor-pointer hover:bg-blue-100 transition-colors"
                      onClick={() => handleSort('created_at')}
                    >
                      <div className="flex items-center justify-center space-x-1">
                        <span>Created On</span>
                        {sortField === 'created_at' && (
                          <span className="text-blue-600">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-blue-800 text-xs uppercase tracking-widest py-3 px-3 text-center border-r border-blue-200/50 w-24">Created By</TableHead>
                    <TableHead 
                      className="font-semibold text-blue-800 text-xs uppercase tracking-widest py-3 px-3 text-center border-r border-blue-200/50 w-24 cursor-pointer hover:bg-blue-100 transition-colors"
                      onClick={() => handleSort('last_login')}
                    >
                      <div className="flex items-center justify-center space-x-1">
                        <span>Last Login</span>
                        {sortField === 'last_login' && (
                          <span className="text-blue-600">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-blue-800 text-xs uppercase tracking-widest py-3 px-3 text-center w-32">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getSortedAndFilteredUsers().map((user, index) => (
                    <TableRow 
                      key={user.id}
                      className={`hover:bg-blue-50 transition-colors ${
                        index % 2 === 0 ? 'bg-white' : 'bg-blue-50/30'
                      }`}
                    >
                      <TableCell className="font-medium py-2 px-3 w-32">
                        <div className="flex items-center space-x-1 truncate">
                          <User className="h-3 w-3 text-gray-500 flex-shrink-0" />
                          <span className="truncate text-sm">{user.username}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-2 px-3 w-48">
                        <div className="flex items-center space-x-1 truncate">
                          <Mail className="h-3 w-3 text-gray-500 flex-shrink-0" />
                          <span className="truncate text-sm">{user.email}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-2 px-3 text-center w-20">
                        <Badge 
                          className={`text-xs ${
                            user.role === 'admin' ? 'bg-red-100 text-red-800' :
                            user.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'
                          }`}
                        >
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2 px-3 w-64">
                        {renderClientBranchAccess(user)}
                      </TableCell>
                      <TableCell className="py-2 px-3 text-center w-20">
                        <Badge className={`text-xs ${getStatusColor(user.status)}`}>
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2 px-3 text-center text-xs text-gray-600 w-24">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell className="py-2 px-3 text-center text-xs text-gray-600 w-24">
                        {user.created_by ? user.created_by.substring(0, 8) + '...' : 'N/A'}
                      </TableCell>
                      <TableCell className="py-2 px-3 text-center text-xs text-gray-600 w-24">
                        {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                      </TableCell>
                      <TableCell className="py-2 px-3 text-center w-32">
                        <div className="flex items-center justify-center space-x-1">
                          <Select
                            value={user.status}
                            onValueChange={(status) => updateStatusMutation.mutate({ userId: user.user_id, status })}
                          >
                            <SelectTrigger className="w-20 h-6 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="inactive">Inactive</SelectItem>
                              <SelectItem value="pending">Pending</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              // Set form data for editing
                              // For admin/manager roles, get all available client-branch combinations
                              // For client roles, use the user's assigned combinations
                              let clientBranches: string[] = [];
                              
                              if (user.role === 'admin' || user.role === 'manager') {
                                // For admin/manager, get all available combinations
                                clientBranches = getUniqueClientBranches();
                              } else {
                                // For client role, map the arrays to combinations
                                // Handle cases where arrays might be different lengths
                                const maxLength = Math.max(
                                  user.associated_clients?.length || 0,
                                  user.associated_branches?.length || 0
                                );
                                
                                clientBranches = Array.from({ length: maxLength }, (_, idx) => {
                                  const client = user.associated_clients?.[idx] || '';
                                  const branch = user.associated_branches?.[idx] || 'All Branches';
                                  return `${client} - ${branch}`;
                                }).filter(cb => cb.trim() !== ' - ' && cb.trim() !== '');
                              }
                              
                              setUserForm({
                                username: user.username,
                                email: user.email,
                                associated_client_branches: clientBranches,
                                role: user.role
                              });
                              setEditingUserId(user.user_id);
                              // Scroll to form
                              document.getElementById('create-user-form')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="h-6 w-6 p-0"
                            title="Edit user"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setDeletingUserId(user.user_id)}
                            className="h-6 w-6 p-0"
                            title="Delete user"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="mb-4">
                <p className="text-lg font-medium">No users found</p>
                <p className="text-sm">The user_management table may not exist yet.</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-sm text-blue-800 font-medium mb-2">To get started:</p>
                <ol className="text-sm text-blue-700 text-left space-y-1">
                  <li>1. Go to Supabase SQL Editor</li>
                  <li>2. Run the CREATE_AND_SETUP_USER_MANAGEMENT.sql script</li>
                  <li>3. Refresh this page</li>
                </ol>
                <p className="text-xs text-blue-600 mt-2">
                  File location: sql/fixes/CREATE_AND_SETUP_USER_MANAGEMENT.sql
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      {deletingUserId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm User Deletion</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this user? This action will permanently remove the user from both the user management system and the authentication system. This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setDeletingUserId(null)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  deleteUserMutation.mutate(deletingUserId);
                  setDeletingUserId(null);
                }}
                disabled={deleteUserMutation.isPending}
                className="flex-1"
              >
                {deleteUserMutation.isPending ? "Deleting..." : "Delete User"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
