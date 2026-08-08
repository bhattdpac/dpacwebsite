from pptx import Presentation
import os

ppt_path = '/root/dpacwebsite/RDC_Presentation.pptx'
prs = Presentation(ppt_path)

def add_slide(title_text, bullet_points):
    try:
        bullet_slide_layout = prs.slide_layouts[1]
    except IndexError:
        bullet_slide_layout = prs.slide_layouts[0]
    slide = prs.slides.add_slide(bullet_slide_layout)
    shapes = slide.shapes
    try:
        title_shape = shapes.title
        title_shape.text = title_text
    except Exception:
        pass
    
    try:
        body_shape = None
        for shape in slide.placeholders:
            if shape.placeholder_format.idx == 1:
                body_shape = shape
                break
        if not body_shape and len(slide.placeholders) > 1:
            body_shape = slide.placeholders[1]
        
        if body_shape:
            tf = body_shape.text_frame
            tf.text = bullet_points[0]
            for bullet in bullet_points[1:]:
                p = tf.add_paragraph()
                p.text = bullet
    except Exception:
        pass

add_slide("Ph.D. Research Timeline", [
    "Months 0-6: Course Work (Completed) & Guide/Mentor Allocation (Allotted).",
    "Months 7-12: Literature Review, Synopsis Submission & Review, ETP 1 (1 Conference Paper).",
    "Months 16-24: Literature Review, ETP 2 (1 Scopus Paper) and ETP 3 (1 Scopus/WoS + 1 Conference).",
    "Months 25-30: ETP 4 (As per requirements) & continued Experimental Design/Research Work.",
    "Months 31-40: Pre-Thesis Presentation, Thesis Submission, Evaluation, and Final Ph.D. Viva Voce Exam."
])

try:
    prs.save(ppt_path)
    print("Timeline slide added successfully to", ppt_path)
except Exception as e:
    print("Error updating presentation:", e)
