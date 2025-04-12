class AddIdentifierToCreditPackages < ActiveRecord::Migration[8.0]
  def change
    add_column :credit_packages, :identifier, :string
    add_index :credit_packages, :identifier, unique: true
  end
end
