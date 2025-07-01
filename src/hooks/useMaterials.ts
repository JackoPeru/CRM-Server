import { useCallback } from 'react';
import { useAppDispatch, useAppSelector, selectAllMaterials, selectMaterialsLoading, selectMaterialsError, selectMaterialsPagination, selectMaterialsFilters, selectMaterialsStats, selectMaterialCategories, selectMaterialSuppliers } from '../store';
import {
  fetchMaterials,
  createMaterial,
  updateMaterial,
  deleteMaterial as removeMaterialAction,
  searchMaterials,
  fetchMaterialsStats,
  fetchMaterialCategories,
  fetchMaterialSuppliers,
  setMaterialsFilters,
  setMaterialsPagination,
  clearMaterialsError,
} from '../store/slices/materialsSlice';
import type { Material, MaterialsFilters } from '../store/slices/materialsSlice';

/**
 * Hook personalizzato per gestire i materiali
 * Fornisce metodi CRUD e stato per la gestione dei materiali
 */
export const useMaterials = () => {
  const dispatch = useAppDispatch();
  const materials = useAppSelector(selectAllMaterials);
  const loading = useAppSelector(selectMaterialsLoading);
  const error = useAppSelector(selectMaterialsError);
  const pagination = useAppSelector(selectMaterialsPagination);
  const filters = useAppSelector(selectMaterialsFilters);
  const stats = useAppSelector(selectMaterialsStats);
  const categories = useAppSelector(selectMaterialCategories);
  const suppliers = useAppSelector(selectMaterialSuppliers);



  /**
   * Ricarica i materiali con i filtri correnti
   */
  const refetch = useCallback(() => {
    dispatch(fetchMaterials());
  }, [dispatch]);

  /**
   * Aggiunge un nuovo materiale
   */
  const addMaterial = useCallback(async (materialData: Omit<Material, 'id' | 'createdAt' | 'updatedAt'>) => {
    const result = await dispatch(createMaterial(materialData));
    if (result.meta.requestStatus === 'fulfilled') {
      // Ricarica la lista dopo l'aggiunta
      dispatch(fetchMaterials());
      dispatch(fetchMaterialsStats());
      return true;
    }
    return false;
  }, [dispatch]);

  /**
   * Aggiorna un materiale esistente
   */
  const updateMaterialData = useCallback(async (id: string, materialData: Partial<Material>) => {
    const result = await dispatch(updateMaterial({ id, data: materialData }));
    if (result.meta.requestStatus === 'fulfilled') {
      // Ricarica la lista dopo l'aggiornamento
      dispatch(fetchMaterials());
      dispatch(fetchMaterialsStats());
      return true;
    }
    return false;
  }, [dispatch]);

  /**
   * Elimina un materiale
   */
  const removeMaterial = useCallback(async (id: string) => {
    const result = await dispatch(removeMaterialAction(id));
    if (result.meta.requestStatus === 'fulfilled') {
      // Ricarica la lista dopo l'eliminazione
      dispatch(fetchMaterials());
      dispatch(fetchMaterialsStats());
      return true;
    }
    return false;
  }, [dispatch]);

  /**
   * Cerca materiali
   */
  const searchMaterialData = useCallback(async (query: string) => {
    const result = await dispatch(searchMaterials(query));
    return result.meta.requestStatus === 'fulfilled';
  }, [dispatch]);

  /**
   * Imposta i filtri per i materiali
   */
  const setFilter = useCallback((filter: Partial<MaterialsFilters>) => {
    dispatch(setMaterialsFilters(filter));
    // Ricarica i dati con i nuovi filtri
    dispatch(fetchMaterials());
  }, [dispatch]);

  /**
   * Cambia pagina
   */
  const setPage = useCallback((page: number) => {
    dispatch(setMaterialsPagination({ page }));
    dispatch(fetchMaterials());
  }, [dispatch]);

  /**
   * Pulisce gli errori
   */
  const clearError = useCallback(() => {
    dispatch(clearMaterialsError());
  }, [dispatch]);

  /**
   * Trova un materiale per ID
   */
  const getMaterialById = useCallback((id: string) => {
    return materials.find(material => material.id === id);
  }, [materials]);

  /**
   * Ricarica categorie e fornitori
   */
  const refetchMetadata = useCallback(() => {
    dispatch(fetchMaterialCategories());
    dispatch(fetchMaterialSuppliers());
  }, [dispatch]);

  return {
    // Stato
    materials,
    loading,
    error,
    pagination,
    filters,
    stats,
    categories,
    suppliers,
    
    // Azioni
    refetch,
    addMaterial,
    updateMaterial: updateMaterialData,
    removeMaterial,
    searchMaterials: searchMaterialData,
    setFilter,
    setPage,
    clearError,
    getMaterialById,
    refetchMetadata,
  };
};

export default useMaterials;