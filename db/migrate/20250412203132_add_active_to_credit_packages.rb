class AddActiveToCreditPackages < ActiveRecord::Migration[8.0]
  def change
    add_column :credit_packages, :active, :boolean
  end
end
