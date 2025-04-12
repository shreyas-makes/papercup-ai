class AddDescriptionToCreditPackages < ActiveRecord::Migration[8.0]
  def change
    add_column :credit_packages, :description, :text
  end
end
