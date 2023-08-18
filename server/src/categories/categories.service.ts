import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { CategoriesRepository } from './categories.repository';
import { CategoriesOutput } from './dto/categories.dto';
import { CategoryOutput } from './dto/category.dto';
import { Category } from './entities/category.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoriesRepository: CategoriesRepository,
  ) {}

  async getAllCategories(): Promise<CategoriesOutput> {
    try {
      const categories = await this.categoriesRepository.find();
      return { ok: true, categories };
    } catch (error) {
      return { ok: false, error };
    }
  }

  async getCategoryBySlug(slug: string): Promise<CategoryOutput> {
    try {
      const category = await this.categoriesRepository.findOne({
        where: { slug },
      });
      if (!category) return { ok: false, error: 'Category not found' };

      return { ok: true, category };
    } catch (error) {
      return { ok: false, error: 'Could not find category' };
    }
  }
}
