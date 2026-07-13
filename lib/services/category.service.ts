import { db } from "@/lib/db"
import { documentCategories } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

/**
 * Category Service - Handles all document category operations
 */
export class CategoryService {
  /**
   * Get all active categories
   */
  static async getCategories() {
    try {
      const categories = await db
        .select()
        .from(documentCategories)
        .where(eq(documentCategories.isActive, true))
        .orderBy(documentCategories.name)

      return categories
    } catch (err) {
      console.error('Failed to fetch categories:', err)
      throw new Error('Failed to fetch categories')
    }
  }

  /**
   * Get category by ID
   */
  static async getCategory(id: string) {
    const category = await db.query.documentCategories.findFirst({
      where: eq(documentCategories.id, id),
    })

    if (!category) throw new Error('Category not found')
    return category
  }

  /**
   * Create a new category
   */
  static async createCategory(
    name: string,
    code: string,
    description?: string,
    color?: string
  ) {
    const categoryId = crypto.randomUUID()

    try {
      await db.insert(documentCategories).values({
        id: categoryId,
        name,
        code: code.toUpperCase(),
        description,
        color: color || '#6B4423',
        isActive: true,
      })

      return {
        id: categoryId,
        name,
        code: code.toUpperCase(),
        description,
        color: color || '#6B4423',
        isActive: true,
      }
    } catch (err: any) {
      if (err.code === '23505') {
        throw new Error('Category name or code already exists')
      }
      throw new Error('Failed to create category')
    }
  }

  /**
   * Update category
   */
  static async updateCategory(
    id: string,
    updates: {
      name?: string
      code?: string
      description?: string
      color?: string
      isActive?: boolean
    }
  ) {
    try {
      await db
        .update(documentCategories)
        .set({
          ...updates,
          code: updates.code ? updates.code.toUpperCase() : undefined,
          updatedAt: new Date(),
        })
        .where(eq(documentCategories.id, id))

      return await this.getCategory(id)
    } catch (err) {
      throw new Error('Failed to update category')
    }
  }

  /**
   * Delete category (soft delete)
   */
  static async deleteCategory(id: string) {
    try {
      await db
        .update(documentCategories)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(documentCategories.id, id))

      return { success: true }
    } catch (err) {
      throw new Error('Failed to delete category')
    }
  }
}
