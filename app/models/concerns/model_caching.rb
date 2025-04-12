module ModelCaching
  extend ActiveSupport::Concern

  class_methods do
    def cached_find(id)
      Rails.cache.fetch("#{cache_key_prefix}/#{id}", expires_in: 1.hour) do
        find_by(id: id)
      end
    end

    def cached_count
      Rails.cache.fetch("#{cache_key_prefix}/count", expires_in: 10.minutes) do
        count
      end
    end
    
    def cached_sum(column)
      Rails.cache.fetch("#{cache_key_prefix}/sum/#{column}", expires_in: 10.minutes) do
        sum(column)
      end
    end

    def clear_cache_for(id)
      Rails.cache.delete("#{cache_key_prefix}/#{id}")
    end
    
    def clear_count_cache
      Rails.cache.delete("#{cache_key_prefix}/count")
    end
    
    def clear_sum_cache(column)
      Rails.cache.delete("#{cache_key_prefix}/sum/#{column}")
    end
    
    private
    
    def cache_key_prefix
      name.underscore
    end
  end
  
  # Instance methods
  
  included do
    after_commit :clear_instance_cache
    
    def clear_instance_cache
      self.class.clear_cache_for(id)
      self.class.clear_count_cache
      
      # Clear any sum caches that might be affected by this model
      if self.class.column_names.include?('credit_balance_cents')
        self.class.clear_sum_cache('credit_balance_cents')
      end
    end
    
    # Cached association loading
    def cached_association(association_name)
      Rails.cache.fetch("#{cache_key}/#{association_name}", expires_in: 30.minutes) do
        send(association_name)
      end
    end
    
    def clear_association_cache(association_name)
      Rails.cache.delete("#{cache_key}/#{association_name}")
    end
    
    def cache_key
      "#{self.class.name.underscore}/#{id}-#{updated_at.to_i}"
    end
  end
end 