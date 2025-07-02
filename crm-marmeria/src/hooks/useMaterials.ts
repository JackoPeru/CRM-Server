import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector, selectAllMaterials, selectMaterialsLoading, selectMaterialsError, selectSelectedMaterial, selectMaterialsPagination, selectMaterialsFilters, selectMaterialsStats, selectMaterialCategories, selectMaterialSuppliers } from '../store';
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

  // Carica i materiali all'avvio
  useEffect(() => {
    console.log('🔍 [useMaterials] useEffect iniziale - caricamento dati materiali');
    dispatch(fetchMaterials());
    dispatch(fetchMaterialsStats());
    dispatch(fetchMaterialCategories());
    dispatch(fetchMaterialSuppliers());
  }, [dispatch]);

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
    console.log('➕ [useMaterials] Aggiunta materiale:', materialData.name);
    const result = await dispatch(createMaterial(materialData));
    if (result.meta.requestStatus === 'fulfilled') {
      console.log('✅ [useMaterials] Materiale aggiunto con successo, ricarico lista');
      // PROBLEMA: Queste chiamate causano un loop infinito!
      // dispatch(fetchMaterials());
      // dispatch(fetchMaterialsStats());
      return true;
    }
    console.log('❌ [useMaterials] Errore aggiunta materiale');
    return false;
  }, [dispatch]);

  /**
   * Aggiorna un materiale esistente
   */
  const updateMaterialData = useCallback(async (id: string, materialData: Partial<Material>) => {
    console.log('✏️ [useMaterials] Aggiornamento materiale:', id);
    const result = await dispatch(updateMaterial({ id, data: materialData }));
    if (result.meta.requestStatus === 'fulfilled') {
      console.log('✅ [useMaterials] Materiale aggiornato con successo');
      // PROBLEMA: Queste chiamate causano un loop infinito!
      // dispatch(fetchMaterials());
      // dispatch(fetchMaterialsStats());
      return true;
    }
    console.log('❌ [useMaterials] Errore aggiornamento materiale');
    return false;
  }, [dispatch]);

  /**
   * Elimina un materiale
   */
  const removeMaterial = useCallback(async (id: string) => {
    console.log('🗑️ [useMaterials] Eliminazione materiale:', id);
    const result = await dispatch(removeMaterialAction(id));
    if (result.meta.requestStatus === 'fulfilled') {
      console.log('✅ [useMaterials] Materiale eliminato con successo');
      // PROBLEMA: Queste chiamate causano un loop infinito!
      // dispatch(fetchMaterials());
      // dispatch(fetchMaterialsStats());
      return true;
    }
    console.log('❌ [useMaterials] Errore eliminazione materiale');
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
    console.log('🔍 [useMaterials] Impostazione filtri:', filter);
    dispatch(setMaterialsFilters(filter));
    // PROBLEMA: Questa chiamata può causare troppe richieste API
    // dispatch(fetchMaterials());
  }, [dispatch]);

  /**
   * Cambia pagina
   */
  const setPage = useCallback((page: number) => {
    console.log('📄 [useMaterials] Cambio pagina:', page);
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