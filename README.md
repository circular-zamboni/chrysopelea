# What is Chrysopelea?

Zero-infrastructure data storage, collaborative manipulation, analysis,
and visualization. This is enabled by using Airtable combined with Python running
in the browser.

## What this block does

The Chrysopelea [(flying snakes!)](https://en.wikipedia.org/wiki/Chrysopelea) block enables the user to define script variables that are populated with user-selected Airtable data to feed into Python scripts. The user defines the script variable names, and what tables/views should be used to populate each variable. The user also defines the table to be used to store the Python scripts. Finally, the user can select a script and run it. Plots generated by the script are rendered in the block, and the script results are displayed. In case of script error, the error is displayed. The user can also define tables to store the results of Python scripts.

Be aware that Airtable data read/write throughput constraints can cause scripts to take some time
to complete execution, depending on the use case and the amount of Airtable data involved.

## How to remix this block

1. Create a new base (or you can use an existing base).

2. Create a new block in your base (see [Create a new block](https://airtable.com/developers/blocks/guides/hello-world-tutorial#create-a-new-block),
   selecting "Remix from Github" as your template.

3. From the root of your new block, run `block run`.

## How it works, and credits

99% of the functionality of this block comes from the "Pyodide" project, which
implements Python within the web browser using WebAssembly.

Documentation, source, and license
of "Pyodide" are available at the links below. The "Pyodide" functions
are incorporated by loading "Pyodide" WebAssembly files into your browser.

  https://pyodide.readthedocs.io/en/latest/

  https://github.com/iodide-project/pyodide

  https://github.com/iodide-project/pyodide/blob/master/LICENSE

  https://webassembly.org/

## Chrysopelea Python syntax cheat sheet

### Create and render a matplotlib plot

Use the method chrysopelea.saveAirplot(plot, plotName). The argument
'plot' should be a matplotlib plot object. The argument
'plotName' is used as a label when rendering the plot.

This method is magically available to your code without requiring an import.

```python
#
import numpy as np
import matplotlib.pyplot as plt

# example1
# evenly sampled time at 200ms intervals
t = np.arange(0., 5., 0.2)

# red dashes, blue squares and green triangles
plt.plot(t, t, 'r--', t, t**2, 'bs', t, t**3, 'g^')
chrysopelea.saveAirplot(plt, 'example1')

# example2
#----------
plt.clf()
data = {'a': np.arange(50),
        'c': np.random.randint(0, 50, 50),
        'd': np.random.randn(50)}
data['b'] = data['a'] + 10 * np.random.randn(50)
data['d'] = np.abs(data['d']) * 100

plt.scatter('a', 'b', c='c', s='d', data=data)
plt.xlabel('entry a')
plt.ylabel('entry b')
chrysopelea.saveAirplot(plt, 'example2')
```

### Read and write data from/to Airtable

To see the syntax for reading input variables or
writing output variables, enable and view the "Data Inputs Summary" and
"Data Outputs Summary" sections of the block.

The presence of identifiers of the form listed below are dependent
on your block configuration.

- chrysopelea.inputs.AAAA - AAAA is script input variable name.
- chrysopelea.outputs.BBBB - BBBB is script output variable name.
- myPythonInputVar = [row.getCellValue("FFFF") for row in chrysopelea.inputs.AAAA] - read Airtable field FFFF data from Airtable record rows to populate python array.
- chrysopelea.outputs.BBBB.GGGG = myPythonOutputVar - write Airtable records, field
GGGG, using python array.

An example is shown below. The example assumes a particular block
configuration that is not described here.  Your equivalent identifiers of
the form "AAAA", "BBBB", "CCCC"
illustrated above will be listed and described in the block's "Data Inputs Summary" and
"Data Outputs Summary".

```python
#
chrysopelea.outputs.regionalAverageAnomaly.YYYYMM = [row.getCellValue("YYYYMM") for row in chrysopelea.inputs.usGreatPlains]

usGreatPlains_Anomaly_Degrees_Celsius = [row.getCellValue("Anomaly Degrees Celsius") for row in chrysopelea.inputs.usGreatPlains]
usNorthwest_Anomaly_Degrees_Celsius   = [row.getCellValue("Anomaly Degrees Celsius") for row in chrysopelea.inputs.usNorthwest]
usSoutheast_Anomaly_Degrees_Celsius   = [row.getCellValue("Anomaly Degrees Celsius") for row in chrysopelea.inputs.usSoutheast]

arrays = np.array([usGreatPlains_Anomaly_Degrees_Celsius, usNorthwest_Anomaly_Degrees_Celsius, usSoutheast_Anomaly_Degrees_Celsius])

mean_Degrees_Celsius = np.mean( arrays, axis = 0 )

chrysopelea.outputs.regionalAverageAnomaly.Anomaly_Degrees_Celsius = mean_Degrees_Celsius
```
