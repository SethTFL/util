angular.module("Tabular", [])
.config(function($sceDelegateProvider) {
    $sceDelegateProvider.resourceUrlWhitelist([
        'http://localhost/**'
    ]);
})
.factory("TableData", [function()
{
    var obj = {};
    obj.Pivot = function(inData, inIndex)
    {
        var i, j;
        var output;
        var row;
        var cell;
        var match;

        output = [];

        for(i=0; i<inData.Rows.length; i++)
        {
            row = inData.Rows[i];
            cell = row[inIndex];
            match = false;

            for(j=0; j<output.length; j++)
            {
                if(cell.toLowerCase() == output[j].Name.toLowerCase())
                {
                    match = true;
                    output[j].Rows.push(row);
                    break;
                }
            }
            if(!match)
            {
                var newTable;

                newTable = obj.Create();
                newTable.Name = cell;
                newTable.Header = inData.Header;
                newTable.Rows = [row];

                output.push(newTable);
            }
        }

        return output;
    };



    obj.PivotTree = function(inData, inIndexArray)
    {
        var i, j, k;
        var branch;
        var root;

        var genOld = [];
        var genNew = [];

        root = inData.Pivot(inIndexArray[0]);
        genOld = root;

        if(inIndexArray.length > 1)
        {
            for(i=1; i<inIndexArray.length; i++)
            {
                for(j=0; j<genOld.length; j++)
                {
                    branch = genOld[j].Pivot(inIndexArray[i]);
                    genOld[j].Children = branch;
                    for(k=0; k<branch.length; k++)
                    {
                        genNew.push(branch[k]);
                    }
                }
                
                genOld = genNew;
                genNew = [];
            }
        }

        return root;
    };

    obj.Create = function()
    {
        var data = {
            Name:"",
            Header:[],
            Rows:[],
        };

        data.Pivot = function(inIndex)
        {
            return obj.Pivot(data, inIndex);
        };

        return data;
    }

    return obj;
}])
.factory("Download", ["$http", "TableData", function($http, TableData)
{
    return function(inURL, inDone)
    {
        var data = TableData.Create();

        var config = {
            step: function(inRow)
            {
                var i, j, k;
                var cell;
                var row;
                var match;
                var LUT;

                row = inRow.data[0];

                if(data.Header.length == 0)
                {
                    data.Header = row;
                }
                else
                {
                    data.Rows.push(row);
                }
            },
            complete: function()
            {
                inDone(data);
            }
        };
        $http.get(inURL).then(function(inResponse)
        {
            Papa.parse(inResponse.data, config);
        });
    };
}])
.factory("Table", ["$http", function($http)
{
    var obj = {};
    obj.Create = function()
    {
        var Table = {};
        Table.Header = undefined;
        Table.Rows = [];
        Table.Visible = [];

        Table.Column = -1;
        Table.ColumnDirection = 1;

        Table.PagingOptions = [20, 50, 100, 200];
        Table.PageRadius = 1;

        Table.PerPage = Table.PagingOptions[0];
        Table.Pages = [];
        Table.Page = 0;
        Table.PageMin = 0;
        Table.PageMax = 0;

        // re-cut the data into pages of size Table.PerPage
        Table.UpdatePagination = function()
        {
            Table.Pages = [];
            Table.Page = 0;
            for(var i=0; i<Math.ceil(Table.Rows.length / Table.PerPage)-1; i++)
            {
                Table.Pages.push({
                    index: i,
                    min: i*Table.PerPage,
                    max: (i+1)*Table.PerPage,
                    active: false
                });
            }
            Table.Pages.push({
                index: i,
                min: i*Table.PerPage,
                max: Table.Rows.length,
                active: false
            });
            Table.SetPage(0);
        };
        Table.SetPage = function(inIndex)
        {
            Table.Page.active = false;
            Table.Page = Table.Pages[inIndex];
            Table.Page.active = true;
            Table.Visible = [];
            for(var i=Table.Page.min; i<Table.Page.max; i++)
            {
                Table.Visible.push(Table.Rows[i]);
            }

            Table.PageMin = Table.Page.index - Table.PageRadius;
            if(Table.PageMin < 0)
            {
                Table.PageMin = 0;
            }
            Table.PageMax = Table.Page.index + Table.PageRadius;
            if(Table.PageMin >= Table.Pages.length-1)
            {
                Table.PageMax = Table.Pages.length-1;
            }
        };
        Table.InRange = function(inIndex)
        {
            if(inIndex >= Table.PageMin && inIndex <= Table.PageMax)
            {
                return true;
            }
            return false;
        };
        Table.SetSort = function(inIndex)
        {
            if(Table.Column == inIndex)
            {
                Table.ColumnDirection *= -1;
            }
            else
            {
                Table.Column = inIndex;
                Table.ColumnDirection = 1;
            }
            
            Table.Rows.sort(function(a, b)
            {
                var aProp = a[inIndex].toUpperCase();
                var bProp = b[inIndex].toUpperCase();
                return (aProp === bProp ? 0 : (aProp < bProp ? -Table.ColumnDirection : Table.ColumnDirection));
            });
            Table.UpdatePagination();
        }


        Table.Populate = function(inTableData)
        {
            Table.Header = inTableData.Header;
            Table.Rows = inTableData.Rows;
            Table.UpdatePagination();
        };

        return Table;
    };
    return obj;
}]);