from PIL import Image
import cairosvg
import os

def convert_svg_to_ico():
    # Create assets directory if it doesn't exist
    if not os.path.exists('assets'):
        os.makedirs('assets')
    
    # Convert SVG to PNG first
    cairosvg.svg2png(url='assets/icon.svg', write_to='assets/icon.png')
    
    # Open the PNG and convert to ICO
    img = Image.open('assets/icon.png')
    
    # Create different sizes for the ICO file
    icon_sizes = [(16,16), (32,32), (48,48), (64,64), (128,128), (256,256)]
    img.save('assets/icon.ico', format='ICO', sizes=icon_sizes)
    
    print("Icon created successfully!")

if __name__ == '__main__':
    convert_svg_to_ico() 