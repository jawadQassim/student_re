import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api, { getApiErrorMessage } from '../lib/api';
import { useAuth } from './AuthContext';

const dataQueryKeys = ['users', 'classes', 'grades', 'schedule', 'projects', 'auth'];

function makeMutationAction(mutateAsync, fallbackMessage) {
  return async (payload) => {
    try {
      return await mutateAsync(payload);
    } catch (error) {
      throw new Error(getApiErrorMessage(error, fallbackMessage));
    }
  };
}

async function invalidateSchoolQueries(queryClient, ...queryPrefixes) {
  await Promise.all(
    queryPrefixes.map((queryKey) =>
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === queryKey,
      }),
    ),
  );
}

export function SchoolDataProvider({ children }) {
  return children;
}

export function useSchoolData() {
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();
  const role = user?.role ?? null;

  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.get('/users');
      return response.data;
    },
    enabled: isAuthenticated && role === 'Admin',
    staleTime: 30 * 1000,
  });

  const classesQuery = useQuery({
    queryKey: ['classes', role, user?.id],
    queryFn: async () => {
      const response = await api.get('/classes');
      return response.data;
    },
    enabled: isAuthenticated,
    staleTime: 30 * 1000,
  });

  const gradesQuery = useQuery({
    queryKey: ['grades', role, user?.id],
    queryFn: async () => {
      const response = await api.get('/grades');
      return response.data;
    },
    enabled: isAuthenticated && (role === 'Teacher' || role === 'Student'),
    staleTime: 30 * 1000,
  });

  const scheduleQuery = useQuery({
    queryKey: ['schedule', user?.id],
    queryFn: async () => {
      const response = await api.get('/schedule');
      return response.data;
    },
    enabled: isAuthenticated && role === 'Teacher',
    staleTime: 30 * 1000,
  });

  const projectsQuery = useQuery({
    queryKey: ['projects', role, user?.id],
    queryFn: async () => {
      const response = await api.get('/projects');
      return response.data;
    },
    enabled: isAuthenticated && role === 'Student',
    staleTime: 30 * 1000,
  });

  const createUserMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await api.post('/users', payload);
      return response.data;
    },
    onSuccess: async () => {
      await invalidateSchoolQueries(queryClient, ...dataQueryKeys);
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, payload }) => {
      const response = await api.put(`/users/${userId}`, payload);
      return response.data;
    },
    onSuccess: async () => {
      await invalidateSchoolQueries(queryClient, ...dataQueryKeys);
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId) => {
      await api.delete(`/users/${userId}`);
    },
    onSuccess: async () => {
      await invalidateSchoolQueries(queryClient, ...dataQueryKeys);
    },
  });

  const createClassMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await api.post('/classes', payload);
      return response.data;
    },
    onSuccess: async () => {
      await invalidateSchoolQueries(queryClient, 'classes');
    },
  });

  const updateClassMutation = useMutation({
    mutationFn: async ({ classId, payload }) => {
      const response = await api.put(`/classes/${classId}`, payload);
      return response.data;
    },
    onSuccess: async () => {
      await invalidateSchoolQueries(queryClient, 'classes');
    },
  });

  const deleteClassMutation = useMutation({
    mutationFn: async (classId) => {
      await api.delete(`/classes/${classId}`);
    },
    onSuccess: async () => {
      await invalidateSchoolQueries(queryClient, 'classes');
    },
  });

  const createGradeMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await api.post('/grades', payload);
      return response.data;
    },
    onSuccess: async () => {
      await invalidateSchoolQueries(queryClient, 'grades');
    },
  });

  const updateGradeMutation = useMutation({
    mutationFn: async ({ gradeId, payload }) => {
      const response = await api.put(`/grades/${gradeId}`, payload);
      return response.data;
    },
    onSuccess: async () => {
      await invalidateSchoolQueries(queryClient, 'grades');
    },
  });

  const createScheduleEntryMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await api.post('/schedule', payload);
      return response.data;
    },
    onSuccess: async () => {
      await invalidateSchoolQueries(queryClient, 'schedule');
    },
  });

  const updateScheduleEntryMutation = useMutation({
    mutationFn: async ({ entryId, payload }) => {
      const response = await api.put(`/schedule/${entryId}`, payload);
      return response.data;
    },
    onSuccess: async () => {
      await invalidateSchoolQueries(queryClient, 'schedule');
    },
  });

  const deleteScheduleEntryMutation = useMutation({
    mutationFn: async (entryId) => {
      await api.delete(`/schedule/${entryId}`);
    },
    onSuccess: async () => {
      await invalidateSchoolQueries(queryClient, 'schedule');
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await api.post('/projects', payload);
      return response.data;
    },
    onSuccess: async () => {
      await invalidateSchoolQueries(queryClient, 'projects');
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: async ({ projectId, payload }) => {
      const response = await api.put(`/projects/${projectId}`, payload);
      return response.data;
    },
    onSuccess: async () => {
      await invalidateSchoolQueries(queryClient, 'projects');
    },
  });

  const queries = [usersQuery, classesQuery, gradesQuery, scheduleQuery, projectsQuery];
  const error = queries.find((query) => query.error)?.error ?? null;
  const isLoading = queries.some((query) => query.isLoading);

  return {
    users: usersQuery.data ?? [],
    classes: classesQuery.data ?? [],
    grades: gradesQuery.data ?? [],
    scheduleEntries: scheduleQuery.data ?? [],
    projects: projectsQuery.data ?? [],
    isLoading,
    error,
    createUser: makeMutationAction(createUserMutation.mutateAsync, 'Unable to create that account.'),
    updateUser: (userId, payload) =>
      makeMutationAction(updateUserMutation.mutateAsync, 'Unable to update that account.')({
        userId,
        payload,
      }),
    deleteUser: makeMutationAction(deleteUserMutation.mutateAsync, 'Unable to delete that account.'),
    createClass: makeMutationAction(createClassMutation.mutateAsync, 'Unable to create that class.'),
    updateClass: (classId, payload) =>
      makeMutationAction(updateClassMutation.mutateAsync, 'Unable to update that class.')({
        classId,
        payload,
      }),
    deleteClass: makeMutationAction(deleteClassMutation.mutateAsync, 'Unable to delete that class.'),
    createGrade: makeMutationAction(createGradeMutation.mutateAsync, 'Unable to save that grade.'),
    updateGrade: (gradeId, payload) =>
      makeMutationAction(updateGradeMutation.mutateAsync, 'Unable to update that grade.')({
        gradeId,
        payload,
      }),
    createScheduleEntry: makeMutationAction(
      createScheduleEntryMutation.mutateAsync,
      'Unable to create that timetable slot.',
    ),
    updateScheduleEntry: (entryId, payload) =>
      makeMutationAction(
        updateScheduleEntryMutation.mutateAsync,
        'Unable to update that timetable slot.',
      )({
        entryId,
        payload,
      }),
    deleteScheduleEntry: makeMutationAction(
      deleteScheduleEntryMutation.mutateAsync,
      'Unable to delete that timetable slot.',
    ),
    createProject: makeMutationAction(createProjectMutation.mutateAsync, 'Unable to create that project.'),
    updateProject: (projectId, payload) =>
      makeMutationAction(updateProjectMutation.mutateAsync, 'Unable to update that project.')({
        projectId,
        payload,
      }),
  };
}
