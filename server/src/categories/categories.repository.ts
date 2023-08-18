import { Repository } from 'typeorm';

import { Category } from './entities/category.entity';

export interface CategoriesRepository extends Repository<Category> {
  this: Repository<Category>;
  getOrCreate(name: string): Promise<Category> | null;
}

export const customCategoriesRepository: Pick<CategoriesRepository, any> = {
  async getOrCreate(this: Repository<Category>, name: string) {
    const categoryName = name.trim().toLowerCase();
    const slug = categoryName.replace(/ /g, '-');

    let category = await this.findOne({
      where: { slug },
    });

    if (!category) {
      category = await this.save(this.create({ slug, name: categoryName }));
    }

    return category;
  },
};
