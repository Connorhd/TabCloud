$(function () {
	$('input[name="openin"][value="'+localStorage.openin+'"]').attr('checked','checked');
	$('input[name="deleteconfirm"][value="'+localStorage.deleteconfirm+'"]').attr('checked','checked');
	$('input[name="encryption"][value="'+localStorage.encryption+'"]').attr('checked','checked');
	
	$('input[type="radio"]').change(function (e) {
		localStorage[$(this).attr('name')] = $(this).attr('value')
	});
});