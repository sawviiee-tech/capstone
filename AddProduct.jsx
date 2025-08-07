// All your imports remain unchanged
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  FaUserCircle, FaHome, FaMap, FaBox,
  FaPowerOff, FaTags, FaTabletAlt
} from 'react-icons/fa';

function AddProduct() {
  const navigate = useNavigate();
  const location = useLocation();
  const role = new URLSearchParams(location.search).get('role');
  const isManager = role === 'manager';

  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    details: '',
    brand: '',
    category: '',
    stockQty: 0,
    unit: '',
    price: '',
    image: null,
    sizeOptions: [],
    colorOptions: [],
    sizeColorQuantities: [],
    colorQuantities: [],
    sizeQuantities: [],
    variantSize: '',
    variantColor: '',
    description: '',
    sku: '',
    supplier: '',
    minStockLevel: 0,
    maxStockLevel: 0,
    location: '',
    status: 'active'
  });

  const [hasVariant, setHasVariant] = useState(false);
  const [newSize, setNewSize] = useState('');
  const [newColor, setNewColor] = useState('');
  const [errors, setErrors] = useState({});

  // Load categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('http://localhost:5000/categories');
      const sorted = response.data.sort((a, b) =>
        a.name.localeCompare(b.name, 'en', { sensitivity: 'base' })
      );
      setCategories(sorted);
    } catch (error) {
      console.error('Error fetching categories:', error);
      alert('Failed to load categories. Please try again.');
    }
  };

  // Handle input changes for all form fields
  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    
    // Clear any existing errors for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    setFormData(prev => ({
      ...prev,
      [name]: name === 'image'
        ? files[0]
        : name === 'stockQty' || name === 'minStockLevel' || name === 'maxStockLevel'
        ? parseInt(value) || 0
        : name === 'price'
        ? parseFloat(value) || 0
        : value,
    }));
  };

  // Handle quantity changes for size-color combinations
  const handleQuantityChange = (size, color, value) => {
    setFormData(prev => {
      const updated = [...prev.sizeColorQuantities];
      const index = updated.findIndex(q => q.size === size && q.color === color);
      const quantity = parseInt(value) || 0;
      
      if (index > -1) {
        updated[index].quantity = quantity;
      } else {
        updated.push({ size, color, quantity });
      }
      return { ...prev, sizeColorQuantities: updated };
    });
  };

  // Handle color-only quantity changes
  const handleColorQuantityChange = (color, value) => {
    setFormData(prev => {
      const updated = [...prev.colorQuantities];
      const index = updated.findIndex(c => c.color === color);
      const quantity = parseInt(value) || 0;
      
      if (index > -1) {
        updated[index].quantity = quantity;
      } else {
        updated.push({ color, quantity });
      }
      return { ...prev, colorQuantities: updated };
    });
  };

  // Handle size-only quantity changes
  const handleSizeQuantityChange = (size, value) => {
    setFormData(prev => {
      const updated = [...prev.sizeQuantities];
      const index = updated.findIndex(s => s.size === size);
      const quantity = parseInt(value) || 0;
      
      if (index > -1) {
        updated[index].quantity = quantity;
      } else {
        updated.push({ size, quantity });
      }
      return { ...prev, sizeQuantities: updated };
    });
  };

  // Add new size option
  const addSize = () => {
    if (newSize.trim() && !formData.sizeOptions.includes(newSize.trim())) {
      setFormData(prev => ({ 
        ...prev, 
        sizeOptions: [...prev.sizeOptions, newSize.trim()] 
      }));
      setNewSize('');
    }
  };

  // Add new color option
  const addColor = () => {
    if (newColor.trim() && !formData.colorOptions.includes(newColor.trim())) {
      setFormData(prev => ({ 
        ...prev, 
        colorOptions: [...prev.colorOptions, newColor.trim()] 
      }));
      setNewColor('');
    }
  };

  // Remove size option
  const removeSize = (sizeToRemove) => {
    setFormData(prev => ({
      ...prev,
      sizeOptions: prev.sizeOptions.filter(size => size !== sizeToRemove),
      sizeColorQuantities: prev.sizeColorQuantities.filter(q => q.size !== sizeToRemove),
      sizeQuantities: prev.sizeQuantities.filter(q => q.size !== sizeToRemove)
    }));
  };

  // Remove color option
  const removeColor = (colorToRemove) => {
    setFormData(prev => ({
      ...prev,
      colorOptions: prev.colorOptions.filter(color => color !== colorToRemove),
      sizeColorQuantities: prev.sizeColorQuantities.filter(q => q.color !== colorToRemove),
      colorQuantities: prev.colorQuantities.filter(q => q.color !== colorToRemove)
    }));
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (!formData.brand.trim()) {
      newErrors.brand = 'Brand is required';
    }

    if (formData.price <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }

    if (!hasVariant && formData.stockQty < 0) {
      newErrors.stockQty = 'Stock quantity cannot be negative';
    }

    if (hasVariant) {
      if (formData.sizeOptions.length === 0 && formData.colorOptions.length === 0) {
        newErrors.variants = 'Please add at least one size or color option';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Calculate total stock from variants
  const calculateTotalStock = () => {
    let total = 0;
    
    if (hasVariant) {
      if (formData.sizeColorQuantities.length > 0) {
        total = formData.sizeColorQuantities.reduce((sum, item) => sum + (item.quantity || 0), 0);
      } else if (formData.colorQuantities.length > 0) {
        total = formData.colorQuantities.reduce((sum, item) => sum + (item.quantity || 0), 0);
      } else if (formData.sizeQuantities.length > 0) {
        total = formData.sizeQuantities.reduce((sum, item) => sum + (item.quantity || 0), 0);
      }
    } else {
      total = formData.stockQty || 0;
    }
    
    return total;
  };

  // Generate SKU if not provided
  const generateSKU = () => {
    if (formData.sku.trim()) return formData.sku.trim();
    
    const brandCode = formData.brand.substring(0, 3).toUpperCase();
    const nameCode = formData.name.substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString().slice(-4);
    
    return `${brandCode}${nameCode}${timestamp}`;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      alert('Please fix the errors in the form before submitting.');
      return;
    }

    setIsLoading(true);

    try {
      const uploadData = new FormData();
      
      // Calculate total stock
      const totalStock = calculateTotalStock();
      
      // Prepare product data
      const productData = {
        ...formData,
        stockQty: totalStock,
        sku: generateSKU(),
        totalStock: totalStock,
        availableStock: totalStock,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        hasVariants: hasVariant,
        isActive: true
      };

      // Append all form data to FormData object
      Object.entries(productData).forEach(([key, value]) => {
        if (['sizeColorQuantities', 'colorQuantities', 'sizeQuantities', 'sizeOptions', 'colorOptions'].includes(key)) {
          uploadData.append(key, JSON.stringify(value));
        } else if (key === 'image' && value instanceof File) {
          uploadData.append(key, value);
        } else if (value !== null && value !== undefined) {
          uploadData.append(key, value.toString());
        }
      });

      // Send data to backend API
      const response = await axios.post('http://localhost:5000/products', uploadData, {
        headers: { 
          'Content-Type': 'multipart/form-data'
        },
        timeout: 30000 // 30 second timeout
      });

      if (response.status === 200 || response.status === 201) {
        alert('✅ Product added successfully to inventory!');
        
        // Reset form
        setFormData({
          name: '',
          details: '',
          brand: '',
          category: '',
          stockQty: 0,
          unit: '',
          price: '',
          image: null,
          sizeOptions: [],
          colorOptions: [],
          sizeColorQuantities: [],
          colorQuantities: [],
          sizeQuantities: [],
          variantSize: '',
          variantColor: '',
          description: '',
          sku: '',
          supplier: '',
          minStockLevel: 0,
          maxStockLevel: 0,
          location: '',
          status: 'active'
        });
        
        setHasVariant(false);
        setNewSize('');
        setNewColor('');
        setErrors({});
        
        // Navigate to inventory page
        navigate('/invent');
      }
    } catch (error) {
      console.error('Error adding product:', error);
      
      if (error.response) {
        // Server responded with error status
        const message = error.response.data?.message || 'Failed to add product';
        alert(`❌ ${message}`);
      } else if (error.request) {
        // Request was made but no response received
        alert('❌ No response from server. Please check your connection.');
      } else {
        // Something else happened
        alert('❌ An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    if (window.confirm('Are you sure you want to reset all fields?')) {
      setFormData({
        name: '',
        details: '',
        brand: '',
        category: '',
        stockQty: 0,
        unit: '',
        price: '',
        image: null,
        sizeOptions: [],
        colorOptions: [],
        sizeColorQuantities: [],
        colorQuantities: [],
        sizeQuantities: [],
        variantSize: '',
        variantColor: '',
        description: '',
        sku: '',
        supplier: '',
        minStockLevel: 0,
        maxStockLevel: 0,
        location: '',
        status: 'active'
      });
      setHasVariant(false);
      setNewSize('');
      setNewColor('');
      setErrors({});
    }
  };

  const sidebarItem = (to, icon, label) => (
    <Link to={to} style={sidebarLink}>
      {icon}
      <span>{label}</span>
    </Link>
  );

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'Arial', overflow: 'hidden' }}>
      {isManager && (
        <div style={sidebarStyle}>
          <div style={iconGroupStyle}>
            {sidebarItem('/users', <FaUserCircle size={22} color="#0066ff" />, 'Users')}
            {sidebarItem('/dashboard', <FaHome size={22} color="#0066ff" />, 'Dashboard')}
            {sidebarItem('/map-display', <FaMap size={22} color="#0066ff" />, 'Map')}
            {sidebarItem('/invent', <FaBox size={22} color="#0066ff" />, 'Inventory')}
            {sidebarItem('/kiosk', <FaTabletAlt size={22} color="#0066ff" />, 'Kiosk')}
          </div>
          <div>
            {sidebarItem('/login', <FaPowerOff size={22} color="#0066ff" />, 'Logout')}
          </div>
        </div>
      )}

      <div style={formContainerStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={headerStyle}>Add New Product to Inventory</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link to="/category" style={categoryBtnStyle}>Manage Categories</Link>
            <button type="button" onClick={resetForm} style={resetBtnStyle}>Reset Form</button>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={formStyle}>
          {/* Basic Product Information */}
          <div style={sectionStyle}>
            <h3 style={sectionHeaderStyle}>Basic Information</h3>
            
            <div style={inputGroupStyle}>
              <input 
                name="name" 
                value={formData.name} 
                onChange={handleInputChange} 
                placeholder="Product Name *" 
                style={errors.name ? { ...inputStyle, ...errorInputStyle } : inputStyle}
                required
              />
              {errors.name && <span style={errorTextStyle}>{errors.name}</span>}
            </div>

            <div style={inputGroupStyle}>
              <input 
                name="sku" 
                value={formData.sku} 
                onChange={handleInputChange} 
                placeholder="SKU (auto-generated if empty)" 
                style={inputStyle}
              />
            </div>

            <div style={inputGroupStyle}>
              <textarea 
                name="details" 
                value={formData.details} 
                onChange={handleInputChange} 
                placeholder="Product Details/Description" 
                style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                rows={3}
              />
            </div>

            <div style={inputGroupStyle}>
              <input 
                name="brand" 
                value={formData.brand}
                onChange={handleInputChange} 
                placeholder="Product Brand *" 
                style={errors.brand ? { ...inputStyle, ...errorInputStyle } : inputStyle}
                required
              />
              {errors.brand && <span style={errorTextStyle}>{errors.brand}</span>}
            </div>

            <div style={inputGroupStyle}>
              <select 
                name="category" 
                value={formData.category}
                onChange={handleInputChange} 
                style={errors.category ? { ...inputStyle, ...errorInputStyle } : inputStyle}
                required
              >
                <option value="">Select Category *</option>
                {categories.map(cat => (
                  <option key={cat._id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
              {errors.category && <span style={errorTextStyle}>{errors.category}</span>}
            </div>
          </div>

          {/* Variant Configuration */}
          <div style={sectionStyle}>
            <h3 style={sectionHeaderStyle}>Product Variants</h3>
            
            <div style={{ margin: '15px 0' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '16px' }}>
                <input
                  type="checkbox"
                  checked={hasVariant}
                  onChange={(e) => {
                    const checked = e.target.checked;

                    if (!checked) {
                      const confirmClear = window.confirm(
                        'Unchecking will remove all size and color options and their quantities. Continue?'
                      );
                      if (!confirmClear) return;

                      setFormData(prev => ({
                        ...prev,
                        sizeOptions: [],
                        colorOptions: [],
                        sizeColorQuantities: [],
                        colorQuantities: [],
                        sizeQuantities: [],
                        variantSize: '',
                        variantColor: ''
                      }));

                      setNewSize('');
                      setNewColor('');
                    }

                    setHasVariant(checked);
                  }}
                />
                <strong>Has Variants (Size/Color)?</strong>
              </label>
              {errors.variants && <span style={errorTextStyle}>{errors.variants}</span>}
            </div>

            {hasVariant && (
              <div style={variantSectionStyle}>
                {/* Size Management */}
                <div style={variantInputGroupStyle}>
                  <h4>Size Options</h4>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                    <select 
                      value={newSize} 
                      onChange={(e) => setNewSize(e.target.value)} 
                      style={{ ...inputStyle, flex: 1 }}
                    >
                      <option value="">Select Size</option>
                      {['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'].map(size => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                    <button type="button" onClick={addSize} style={addBtnStyle}>Add Size</button>
                  </div>

                  <div style={tagContainerStyle}>
                    {formData.sizeOptions.map(size => (
                      <span key={size} style={tagStyle}>
                        {size}
                        <button 
                          type="button" 
                          onClick={() => removeSize(size)}
                          style={removeTagBtnStyle}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Color Management */}
                <div style={variantInputGroupStyle}>
                  <h4>Color Options</h4>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                    <input
                      value={newColor}
                      onChange={(e) => setNewColor(e.target.value)}
                      placeholder="Add Color"
                      style={{ ...inputStyle, flex: 1 }}
                    />
                    <button type="button" onClick={addColor} style={addBtnStyle}>Add Color</button>
                  </div>

                  <div style={tagContainerStyle}>
                    {formData.colorOptions.map(color => (
                      <span key={color} style={tagStyle}>
                        {color}
                        <button 
                          type="button" 
                          onClick={() => removeColor(color)}
                          style={removeTagBtnStyle}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Quantity Management */}
                {formData.sizeOptions.length > 0 && formData.colorOptions.length > 0 && (
                  <div style={variantInputGroupStyle}>
                    <h4>Size × Color Combination Quantities</h4>
                    {formData.sizeOptions.map(size => (
                      <div key={size} style={{ marginBottom: '20px' }}>
                        <strong style={{ display: 'block', marginBottom: '8px' }}>Size: {size}</strong>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                          {formData.colorOptions.map(color => {
                            const existing = formData.sizeColorQuantities.find(q => q.size === size && q.color === color);
                            return (
                              <div key={`${size}-${color}`} style={{ display: 'flex', flexDirection: 'column', width: '120px' }}>
                                <label style={{ fontSize: '12px', marginBottom: '4px' }}>{color}</label>
                                <input
                                  type="number"
                                  min="0"
                                  placeholder="Qty"
                                  value={existing?.quantity || ''}
                                  onChange={(e) => handleQuantityChange(size, color, e.target.value)}
                                  style={quantityInputStyle}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Stock and Pricing */}
          <div style={sectionStyle}>
            <h3 style={sectionHeaderStyle}>Stock & Pricing</h3>
            
            {!hasVariant && (
              <div style={inputGroupStyle}>
                <input 
                  name="stockQty" 
                  type="number"
                  min="0"
                  value={formData.stockQty || ''} 
                  onChange={handleInputChange} 
                  placeholder="Stock Quantity *" 
                  style={errors.stockQty ? { ...inputStyle, ...errorInputStyle } : inputStyle}
                  required
                />
                {errors.stockQty && <span style={errorTextStyle}>{errors.stockQty}</span>}
              </div>
            )}

            <div style={inputGroupStyle}>
              <input 
                name="unit" 
                value={formData.unit || ''} 
                onChange={handleInputChange} 
                placeholder="Unit (e.g. pcs, kg, liter)" 
                style={inputStyle}
              />
            </div>

            <div style={inputGroupStyle}>
              <input 
                name="price" 
                type="number"
                step="0.01"
                min="0"
                value={formData.price || ''} 
                onChange={handleInputChange} 
                placeholder="Product Price *" 
                style={errors.price ? { ...inputStyle, ...errorInputStyle } : inputStyle}
                required
              />
              {errors.price && <span style={errorTextStyle}>{errors.price}</span>}
            </div>

            <div style={inputGroupStyle}>
              <input 
                name="minStockLevel" 
                type="number"
                min="0"
                value={formData.minStockLevel || ''} 
                onChange={handleInputChange} 
                placeholder="Minimum Stock Level" 
                style={inputStyle}
              />
            </div>

            <div style={inputGroupStyle}>
              <input 
                name="maxStockLevel" 
                type="number"
                min="0"
                value={formData.maxStockLevel || ''} 
                onChange={handleInputChange} 
                placeholder="Maximum Stock Level" 
                style={inputStyle}
              />
            </div>
          </div>

          {/* Additional Information */}
          <div style={sectionStyle}>
            <h3 style={sectionHeaderStyle}>Additional Information</h3>
            
            <div style={inputGroupStyle}>
              <input 
                name="supplier" 
                value={formData.supplier || ''} 
                onChange={handleInputChange} 
                placeholder="Supplier" 
                style={inputStyle}
              />
            </div>

            <div style={inputGroupStyle}>
              <input 
                name="location" 
                value={formData.location || ''} 
                onChange={handleInputChange} 
                placeholder="Storage Location" 
                style={inputStyle}
              />
            </div>

            <div style={inputGroupStyle}>
              <input 
                name="image" 
                type="file" 
                accept="image/*" 
                onChange={handleInputChange} 
                style={inputStyle}
              />
              <small style={{ color: '#666', fontSize: '12px' }}>
                Supported formats: JPG, PNG, GIF (Max 5MB)
              </small>
            </div>
          </div>

          {/* Form Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '15px', marginTop: '30px' }}>
            <button 
              type="submit" 
              style={isLoading ? { ...submitBtnStyle, ...disabledBtnStyle } : submitBtnStyle}
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save to Inventory'}
            </button>
            <button 
              type="button" 
              onClick={() => navigate('/invent')} 
              style={cancelBtnStyle}
              disabled={isLoading}
            >
              Cancel
            </button>
          </div>

          {/* Display calculated total stock for variants */}
          {hasVariant && (
            <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e8f4f8', borderRadius: '5px' }}>
              <strong>Total Stock: {calculateTotalStock()} units</strong>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

// Styles
const formContainerStyle = {
  flex: 1,
  padding: '40px 60px',
  backgroundColor: '#f4f4f4',
  overflowY: 'auto',
};

const formStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
};

const headerStyle = {
  marginBottom: '10px',
  textAlign: 'left',
  color: '#333',
  fontSize: '28px',
  fontWeight: 'bold'
};

const sectionStyle = {
  backgroundColor: '#ffffff',
  padding: '25px',
  borderRadius: '8px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  border: '1px solid #e0e0e0'
};

const sectionHeaderStyle = {
  color: '#333',
  fontSize: '18px',
  fontWeight: 'bold',
  marginBottom: '15px',
  borderBottom: '2px solid #007bff',
  paddingBottom: '8px'
};

const inputGroupStyle = {
  marginBottom: '15px'
};

const inputStyle = {
  padding: '12px',
  borderRadius: '5px',
  border: '1px solid #ccc',
  fontSize: '14px',
  width: '100%',
  transition: 'border-color 0.3s ease'
};

const errorInputStyle = {
  borderColor: '#dc3545',
  boxShadow: '0 0 0 0.2rem rgba(220,53,69,0.25)'
};

const errorTextStyle = {
  color: '#dc3545',
  fontSize: '12px',
  marginTop: '5px',
  display: 'block'
};

const variantSectionStyle = {
  backgroundColor: '#f8f9fa',
  padding: '20px',
  borderRadius: '5px',
  border: '1px solid #dee2e6'
};

const variantInputGroupStyle = {
  marginBottom: '20px'
};

const tagContainerStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px',
  marginTop: '10px'
};

const tagStyle = {
  backgroundColor: '#007bff',
  color: 'white',
  padding: '4px 8px',
  borderRadius: '15px',
  fontSize: '12px',
  display: 'flex',
  alignItems: 'center',
  gap: '5px'
};

const removeTagBtnStyle = {
  backgroundColor: 'transparent',
  border: 'none',
  color: 'white',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: 'bold'
};

const quantityInputStyle = {
  padding: '6px',
  borderRadius: '4px',
  border: '1px solid #ccc',
  fontSize: '12px',
  textAlign: 'center'
};

const submitBtnStyle = {
  backgroundColor: '#28a745',
  color: 'white',
  padding: '12px 30px',
  borderRadius: '5px',
  border: 'none',
  cursor: 'pointer',
  fontWeight: 'bold',
  fontSize: '16px',
  transition: 'background-color 0.3s ease'
};

const disabledBtnStyle = {
  backgroundColor: '#6c757d',
  cursor: 'not-allowed'
};

const cancelBtnStyle = {
  backgroundColor: '#6c757d',
  color: 'white',
  padding: '12px 30px',
  borderRadius: '5px',
  border: 'none',
  cursor: 'pointer',
  fontSize: '16px'
};

const addBtnStyle = {
  backgroundColor: '#17a2b8',
  color: 'white',
  padding: '8px 15px',
  borderRadius: '4px',
  border: 'none',
  cursor: 'pointer',
  fontSize: '14px'
};

const resetBtnStyle = {
  backgroundColor: '#ffc107',
  color: '#212529',
  padding: '6px 12px',
  borderRadius: '4px',
  textDecoration: 'none',
  fontWeight: 'bold',
  border: 'none',
  cursor: 'pointer'
};

const categoryBtnStyle = {
  backgroundColor: '#007bff',
  color: 'white',
  padding: '6px 12px',
  borderRadius: '4px',
  textDecoration: 'none',
  fontWeight: 'bold',
};

const sidebarStyle = {
  width: '230px',
  background: '#ffffff',
  borderRight: '1px solid #ccc',
  boxShadow: '2px 0 8px rgba(0,0,0,0.05)',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  padding: '20px 12px'
};

const iconGroupStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '20px'
};

const sidebarLink = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '10px',
  textDecoration: 'none',
  color: '#333',
  borderRadius: '8px'
};

export default AddProduct;