import tkinter as tk
from tkinter import ttk

# Create the main window
root = tk.Tk()
root.title("Tkinter Combobox Example")
root.geometry("300x200")

# Define a function to handle selection
def on_select(event):
    selected_value = combobox.get()
    print(f"Selected: {selected_value}")

# Create a combobox
options = ["Select an option", "Option 1", "Option 2", "Option 3"]
combobox = ttk.Combobox(root, values=options, state="readonly")
combobox.set(options[0])  # Set default value
combobox.bind("<<ComboboxSelected>>", on_select)  # Bind the selection event

# Pack the combobox to the window
combobox.pack(pady=20)

# Start the Tkinter event loop
root.mainloop()
