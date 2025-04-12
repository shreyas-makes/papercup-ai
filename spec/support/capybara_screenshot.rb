# Helper method to save screenshots for debugging
def save_debug_screenshot(filename = nil)
  return unless defined?(page) && page.respond_to?(:save_screenshot)
  
  filename ||= "debug_#{Time.now.to_i}.png"
  path = Rails.root.join('tmp', 'capybara', filename)
  FileUtils.mkdir_p(File.dirname(path))
  page.save_screenshot(path)
  puts "Screenshot saved to #{path}"
rescue => e
  puts "Error saving screenshot: #{e.message}"
end 