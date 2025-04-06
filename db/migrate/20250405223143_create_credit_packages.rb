class CreateCreditPackages < ActiveRecord::Migration[8.0]
  def change
    create_table :credit_packages do |t|
      t.string :name
      t.integer :amount_cents
      t.integer :price_cents

      t.timestamps
    end
  end
end
